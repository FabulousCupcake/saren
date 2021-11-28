const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, targetIsCaller } = require("../acl/acl.js");
const { disable } = require("../lambda/lambda.js");

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
    console.info(`Successfully disabled state file for ${discordTag} with account id ${accountId}.`);

    if (responseBody) {
        interaction.followUp({
            content: `I have removed the account data for ${discordTag}!`,
            ephemeral: true,
        });
        return;
    }
    interaction.followUp({
        content: `Hmm, I don't seem to have any account data for ${discordTag}...`,
        ephemeral: true,
    });
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