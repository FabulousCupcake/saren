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

const statusFunc = async (interaction) => {
    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.reply(reason);

    const targetUser = interaction.options.getUser("target");

    // TODO: Invoke Lambda Here
    // const result = suzume.invoke("sync", [targetUser.id]);
    console.log("invoke", "check", targetUser.id);
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