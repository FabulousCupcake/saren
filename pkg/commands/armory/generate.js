const { MessageEmbed } = require("discord.js");
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
    const targetUser = interaction.options.getUser("target") || interaction.member.user;

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

    // Generate armory text
    const armoryTargetText = await getArmoryText(targetUser.id);
    const armoryText = transformToArmorySerializationText(responseBody, armoryTargetText);

    // Reply
    const messageEmbed = new MessageEmbed()
        .setAuthor(targetUser.username, targetUser.avatarURL())
        .setDescription(`\`\`\`${armoryText}\`\`\``)
        .setColor("F55291")
        .setFooter("Generated with data from")
        .setTimestamp(lastSyncTimestamp)

    interaction.followUp({
        embeds: [ messageEmbed ],
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