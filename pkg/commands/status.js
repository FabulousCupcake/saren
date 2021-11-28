const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember, isCalledByClanAdmin, targetIsCaller } = require("../acl/acl.js");
const { check } = require("../lambda/lambda.js");

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
    if (!allowed) return interaction.reply({
        content: reason,
        ephemeral: true,
    });

    // Tell discord that we ACK and reply will be late
    interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser("target");

    let responseBody;
    try {
        const response = await check(targetUser.id);
        responseBody = JSON.parse(Buffer.from(response.Payload).toString());
    } catch (err) {
        console.error("Failed lambda call", err, response);
        interaction.reply({
            content: "Uh oh! Looks like Suzume messed up!",
            ephemeral: true,
        });
        return;
    }

    const discordTag = targetUser.tag;
    const text = (responseBody) ? "do" : "don't";
    interaction.reply({
        content: `I ${text} have account data for ${discordTag}!`,
        ephemeral: true,
    })
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