const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember, isCalledByClanAdmin, targetIsCaller } = require("../acl/acl.js");
const { getUserSyncTimestamp } = require("../redis/redis.js");
const { getUserDetailsFromStateFile } = require("../s3/s3.js");
const { relatime } = require("../utils/format.js");

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

    // Try fetching username from statefile
    const targetUser = interaction.options.getUser("target");
    const userDetails = await getUserDetailsFromStateFile(targetUser.id);

    // It doesn't exist
    if (!userDetails) {
        interaction.followUp({
            content: `Oh no! I don't have an account data for <@!${targetUser.id}>!`,
            ephemeral: true,
        });
        return;
    }

    // Compute last update time
    const currentTimestamp = new Date().getTime();
    const lastSyncTimestamp = await getUserSyncTimestamp(targetUser.id);
    const timestamp = (lastSyncTimestamp) ?
        relatime(lastSyncTimestamp - currentTimestamp) :
        "...I'm not sure when! Probably never!";

    // Send message
    interaction.followUp({
        content: `I have the account data for <@!${targetUser.id}> / ${userDetails.username} (${userDetails.viewer_id}) written down right here! Last sync was done ${timestamp}!`,
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