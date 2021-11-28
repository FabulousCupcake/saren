const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember, isCalledByClanAdmin, targetIsCaller } = require("../acl/acl.js");
const { login } = require("../lambda/lambda.js");

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

    // Tell discord that we ACK and reply will be late
    interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser("target");

    let responseBody;
    try {
        const response = await check(targetUser.id);
        responseBody = JSON.parse(Buffer.from(response.Payload).toString());

        if (!responseBody) throw "Invalid request body";
    } catch (err) {
        console.error("Failed lambda call", err, response);
        interaction.reply({
            content: "Uh oh! Looks like Suzume messed up!",
            ephemeral: true,
        });
        return;
    }

    // TODO: Write to spreadsheet

    const discordTag = targetUser.tag;
    const username = responseBody.user_info.user_name;
    console.info(`Successfully logged in to Discord User ${discordTag} to account id ${accountId} with username ${username}.`);
    interaction.reply({
        content: `I have updated Google Spreadsheet for ${discordTag} / ${username} (${accountId})!`,
        ephemeral: true,
    });
}

const syncSubCommand = new SlashCommandSubcommandBuilder()
    .setName("sync")
    .setDescription("Synchronizes account data of a discord user")
    .addUserOption(option =>
        option
        .setName("target")
        .setDescription("The discord user whose account should be synchronized")
        .setRequired(true))

module.exports = {
    syncFunc,
    syncSubCommand,
}