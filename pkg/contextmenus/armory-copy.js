const { ContextMenuCommandBuilder } = require("@discordjs/builders");
const { ApplicationCommandType } = require("discord-api-types/v9")

const { isCalledByOwner, isCalledByClanMember } = require("../acl/acl.js");
const { getArmoryText, setArmoryText } = require("../redis/redis.js");

const checkPermissions = interaction => {
  if (isCalledByOwner(interaction)) {
    return {
      allowed: true,
      reason: "Caller is application owner",
    };
  }

  if (!isCalledByClanMember(interaction)) {
    return {
      allowed: false,
      reason: "Unable to determine which clan you belong to!",
    };
  }

  return {
    allowed: true,
    reason: "Caller can only be self"
  }
};

const armoryCopyFunc = async (interaction) => {
  const { allowed, reason } = checkPermissions(interaction);
  if (!allowed) return interaction.followUp({
    content: reason,
    ephemeral: true,
  });

  // Obtain armorytext from target user
  const armoryText = await getArmoryText(interaction.targetUser.id);

  // Set it
  await setArmoryText(interaction.member.id, armoryText);

  // Reply
  interaction.followUp({
    content: `I've copied <@!${interaction.targetUser.id}>'s armory target ranks!`,
    ephemeral: true,
  });
}

const armoryCopyContextMenuCommand = new ContextMenuCommandBuilder()
  .setDefaultPermission(false)
  .setName("Copy Armory Text")
  .setType(ApplicationCommandType.User)

module.exports = {
  armoryCopyFunc,
  armoryCopyContextMenuCommand,
};