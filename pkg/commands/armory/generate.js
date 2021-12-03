const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember } = require("../../acl/acl.js");
const { getArmoryText, getUserData, getUserSyncTimestamp } = require("../../redis/redis.js");
const { relatime } = require("../../utils/format.js");
const { transformToArmorySerializationText } = require("./armory.js");

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
            reason: "You are not a member of the clan!",
        };
    }

    return {
        allowed: true,
        reason: "Caller can only be self"
    }
};

const generateArmoryTextFunc = async (interaction) => {
    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.followUp({
        content: reason,
        ephemeral: true,
    });

    // Fetch last sync response body
    const responseBody = await getUserData(interaction.member.id);
    if (!responseBody) {
        interaction.followUp({
            content: "I can't find your data! Please run sync first and try again!",
            ephemeral: true,
        });
        return;
    }

    // Get last sync timestamp and transform into relative time format
    const currentTimestamp = new Date().getTime();
    const lastSyncTimestamp = await getUserSyncTimestamp(interaction.member.id);
    const timeText = relatime(lastSyncTimestamp - currentTimestamp);

    // Generate armory text
    const armoryTargetText = await getArmoryText(interaction.member.id);
    const armoryText = transformToArmorySerializationText(responseBody, armoryTargetText);

    // Reply
    interaction.followUp({
        content: `I found your data from ${timeText}! Here you go! \n\`\`\`${armoryText}\`\`\``,
        ephemeral: true,
    });
}

const generateArmoryTextSubCommand = new SlashCommandSubcommandBuilder()
    .setName("generate")
    .setDescription("Generates pcredivewiki.tw armory import text.")

module.exports = {
    generateArmoryTextFunc,
    generateArmoryTextSubCommand,
}