const { isCalledByOwner, isCalledByClanMember, isCalledByClanAdmin, targetIsCaller } = require("../acl/acl.js");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

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

    if (targetIsCaller(interaction)) {
        return {
            allowed: true,
            reason: "Caller is the target / account owner",
        };
    }

    if (isCalledByClanAdmin(interaction)) {
        return {
            allowed: true,
            reason: "Caller is a clan administrator",
        };
    }

    return {
        allowed: false,
        reason: "You are not allowed to do this!"
    }
};

const syncFunc = async (interaction) => {
    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.reply({
        content: reason,
        ephemeral: true,
    });

    const targetUser = interaction.options.getUser("target");

    // TODO: Invoke Lambda Here
    // const result = suzume.invoke("sync", [targetUser.id]);
    console.log("invoke", "sync", targetUser.id);
}

const syncSubCommand = new SlashCommandSubcommandBuilder()
    .setName("sync")
    .setDescription("Login and synchronize account state to Google Spreadsheets")
    .addUserOption(option =>
        option
        .setName("target")
        .setDescription("The discord user whose account should be synchronized")
        .setRequired(true))

module.exports = {
    syncFunc,
    syncSubCommand,
}