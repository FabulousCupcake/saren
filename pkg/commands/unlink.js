const { isOwner, targetIsCaller } = require("../acl/acl.js");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const checkPermissions = interaction => {
    if (isOwner(interaction.user)) {
        return {
            allowed: true,
            reason: "Caller is application owner",
        };
    }

    if (targetIsCaller(interaction)) {
        return {
            allowed: true,
            reason: "Caller is the target / account owner",
        };
    }

    return {
        allowed: false,
        reason: "You are not allowed to do this!"
    }
};

const unlinkFunc = async (interaction) => {
    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.reply(reason);

    const targetUser = interaction.options.getUser("target");

    // TODO: Invoke Lambda Here
    // const result = suzume.invoke("disable", [targetUser.id]);
    console.log("invoke", "disable", targetUser.id);
}

const unlinkSubCommand = new SlashCommandSubcommandBuilder()
    .setName("unlink")
    .setDescription("Removes the account data from the bot")
    .addUserOption(option =>
        option
        .setName("target")
        .setDescription("The discord user whose account data should be removed")
        .setRequired(true))

module.exports = {
    unlinkFunc,
    unlinkSubCommand,
}