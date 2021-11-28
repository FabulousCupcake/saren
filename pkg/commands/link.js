const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember, targetIsCaller } = require("../acl/acl.js");
const { register } = require("../lambda/lambda.js");

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

    return {
        allowed: false,
        reason: "You are not allowed to do this!"
    }
};

const linkFunc = async (interaction) => {
    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.reply({
        content: reason,
        ephemeral: true,
    });

    // Tell discord that we ACK and reply will be late
    interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser("target");
    const accountId = interaction.options.getString("id");
    const accountPassword = interaction.options.getString("password");

    let responseBody;
    try {
        const response = await register(targetUser.id, accountId, accountPassword);
        responseBody = JSON.parse(Buffer.from(response.Payload).toString());
    } catch (err) {
        console.error("Failed lambda call", err);
        interaction.followUp({
            content: "Uh oh! Looks like Suzume messed up!",
            ephemeral: true,
        });
        return;
    }

    const username = responseBody.user_info.user_name;
    console.info(`Successfully linked Discord User ${targetUser.tag} to account id ${accountId} with username ${username}.`);
    interaction.followUp({
        content: `I have written down the account data for ${targetUser.tag} / ${username} (${accountId})!`,
        ephemeral: true,
    });
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