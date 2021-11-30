const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember, isCalledByClanAdmin, targetIsCaller } = require("../acl/acl.js");
const { hasStateFile } = require("../s3/s3.js");

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

const statusFunc = async (interaction) => {
    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.followUp({
        content: reason,
        ephemeral: true,
    });


    const targetUser = interaction.options.getUser("target");

    const stateFileExists = await hasStateFile(targetUser.id);

    if (stateFileExists) {
        interaction.followUp({
            content: `I have the account data for ${targetUser.tag} written down right here!`,
            ephemeral: true,
        });
        return;
    }

    interaction.followUp({
        content: `Oh no! I don't have the account data for ${targetUser.tag}!`,
        ephemeral: true,
    });
}

const statusSubCommand = new SlashCommandSubcommandBuilder()
    .setName("status")
    .setDescription("Check if the discord user has an account data associated with them")
    .addUserOption(option =>
        option
        .setName("target")
        .setDescription("The discord user whose account should be checked")
        .setRequired(true))

module.exports = {
    statusFunc,
    statusSubCommand,
}