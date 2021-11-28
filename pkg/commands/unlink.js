const { isCalledByOwner, targetIsCaller } = require("../acl/acl.js");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const checkPermissions = interaction => {
    if (isCalledByOwner(interaction)) {
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
    if (!allowed) return interaction.reply({
        content: reason,
        ephemeral: true,
    });

    const targetUser = interaction.options.getUser("target");

    // TODO: Invoke Lambda Here
    // const result = suzume.invoke("disable", [targetUser.id]);
    console.log("invoke", "disable", targetUser.id);
    interaction.reply({
        content: `Invoke Lambda: disable ${targetUser.id}`,
        ephemeral: true,
    })
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