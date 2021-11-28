const { isOwner, isCalledByClanMember, targetIsCaller } = require("../acl/acl.js");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const checkPermissions = interaction => {
    if (isOwner(interaction.user)) {
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

    return {
        allowed: false,
        reason: "You are not allowed to do this!"
    }
};

const linkFunc = async (interaction) => {
    console.log(interaction, interaction.member, interaction.member.roles)

    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.reply(reason);

    const targetUser = interaction.options.getUser("target");
    const accountId = interaction.options.getInteger("id");
    const accountPassword = interaction.options.getString("password");

    // TODO: Invoke Lambda Here
    // const result = suzume.invoke("register", [targetUser.id, accountId, accountPassword]);
    console.log("invoke", "register", targetUser.id, accountId, accountPassword);
}

const linkSubCommand = new SlashCommandSubcommandBuilder()
    .setName("link")
    .setDescription("Links an account data to the bot")
    .addUserOption(option =>
        option
        .setName("target")
        .setDescription("The discord user associated with the account data")
        .setRequired(true))
    .addStringOption(option =>
        option
        .setName("id")
        .setDescription("The 9 digit of the account id, no spaces")
        .setRequired(true))
    .addStringOption(option =>
        option
        .setName("password")
        .setDescription("Account data link password")
        .setRequired(true))

module.exports = {
    linkFunc,
    linkSubCommand,
}