const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember, determineClanConfig } = require("../acl/acl.js");

const checkPermissions = async (interaction) => {
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
        reason: "Can be called by any clan member"
    }
};

const sheetFunc = async (interaction) => {
    const { allowed, reason } = await checkPermissions(interaction);
    if (!allowed) return interaction.followUp({
        content: reason,
        ephemeral: true,
    });

    // Resolve clan
    const config = determineClanConfig(interaction.member);
    const url = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}`;

    // Send message
    interaction.followUp({
        content: `Your clan's roster sheet URL is: <${url}>`,
        ephemeral: true,
    });
}

const sheetSubCommand = new SlashCommandSubcommandBuilder()
    .setName("sheet")
    .setDescription("Just tells you your clan's roster sheet URL")

module.exports = {
    sheetFunc,
    sheetSubCommand,
}