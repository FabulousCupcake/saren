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
        reason: "Can be called by any clan member against anyone"
    }
};

const generateArmoryTextFunc = async (interaction) => {
    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.followUp({
        content: reason,
        ephemeral: true,
    });

    // Determine target
    const targetUser = interaction.options.getUser("target") || interaction.member;

    // Fetch last sync response body
    const responseBody = await getUserData(targetUser.id);
    if (!responseBody) {
        interaction.followUp({
            content: "I can't find your data! Please run sync first and try again!",
            ephemeral: true,
        });
        return;
    }

    // Get last sync timestamp and transform into relative time format
    const currentTimestamp = new Date().getTime();
    const lastSyncTimestamp = await getUserSyncTimestamp(targetUser.id);
    const timeText = relatime(lastSyncTimestamp - currentTimestamp);

    // Generate armory text
    const armoryTargetText = await getArmoryText(targetUser.id);
    const armoryText = transformToArmorySerializationText(responseBody, armoryTargetText);

    // Reply
    interaction.followUp({
        content: `Here you go! This data was from ${timeText}!`,
        files: [{
            attachment: Buffer.from(armoryText, "utf-8"),
            name: `${currentTimestamp}.txt`,
            description: armoryText,
         }],
        ephemeral: true,
    });
}

const generateArmoryTextSubCommand = new SlashCommandSubcommandBuilder()
    .setName("generate")
    .setDescription("Generates pcredivewiki.tw armory import text.")
    .addUserOption(option =>
        option
        .setName("target")
        .setDescription("The discord user whose account data should be exported")
        .setRequired(false))

module.exports = {
    generateArmoryTextFunc,
    generateArmoryTextSubCommand,
}