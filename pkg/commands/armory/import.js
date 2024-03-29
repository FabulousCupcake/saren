const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember } = require("../../acl/acl.js");
const { setArmoryText } = require("../../redis/redis.js");

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

const importArmoryTextFunc = async (interaction) => {
    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.followUp({
        content: reason,
        ephemeral: true,
    });

    const armoryText = interaction.options.getString("armorytext");

    // Drop if >10KB
    if (armoryText.length > 10000) {
        interaction.followUp({
            content: "This is too big, I can't handle this!",
            ephemeral: true,
        });
        return;
    }

    // Check if it has https:// and print nice error
    if (armoryText.includes("https://")) {
        interaction.followUp({
            content: "I see a URL in your input! I only accept raw armory text!",
            ephemeral: true,
        });
        return;
    }

    await setArmoryText(interaction.member.id, armoryText);
    interaction.followUp({
        content: "I've written down your armory text!",
        ephemeral: true,
    });
}

const importArmoryTextSubCommand = new SlashCommandSubcommandBuilder()
    .setName("import")
    .setDescription("Import armory data to preserve your unit target ranks when generating a new armory text")
    .addStringOption(option =>
        option
        .setName("armorytext")
        .setDescription("Armory import text to be used as source of unit target rank")
        .setRequired(true))

module.exports = {
    importArmoryTextFunc,
    importArmoryTextSubCommand,
}