const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember, isCalledByClanAdmin, isInSameClan, targetIsCaller, determineClanConfig } = require("../acl/acl.js");
const { updateSpreadsheet } = require("../sheets/sheets.js");
const { setUserSyncTimestamp, setUserData } = require("../redis/redis.js");
const { isHittingGlobalSyncRateLimit, isHittingUserSyncRateLimit } = require("../redis/ratelimit.js");
const { login } = require("../lambda/lambda.js");

const checkPermissions = async (interaction) => {
    if (isCalledByOwner(interaction)) {
        return {
            allowed: true,
            reason: "Caller is application owner",
        };
    }

    if (!isCalledByClanMember(interaction)) {
        return {
            allowed: false,
            reason: "Unable to determine which clan you belong to!",
        };
    }

    if (targetIsCaller(interaction)) {
        return {
            allowed: true,
            reason: "Caller is the target / account owner",
        };
    }

    if (isCalledByClanAdmin(interaction)) {
        if (await isInSameClan(interaction)) {
            return {
                allowed: true,
                reason: "Caller is a clan administrator",
            };
        }
    }

    return {
        allowed: false,
        reason: "You are not allowed to do this!"
    }
};

const syncFunc = async (interaction) => {
    const { allowed, reason } = await checkPermissions(interaction);
    if (!allowed) return interaction.followUp({
        content: reason,
        ephemeral: true,
    });

    // TODO: Clan battle toggle check
    // Make it harder to accidantally sync during CB, requiring explicit approval/confirmation
    // Either via Message Component button
    //     or via required boolean (ehh)

    // Determine target
    const targetUser = interaction.options.getUser("target") || interaction.member.user;

    // Check ratelimits
    if (await isHittingGlobalSyncRateLimit()) {
        interaction.followUp({
            content: `I'm too busy right now! Please come back later!`,
            ephemeral: true,
        });
        return;
    }
    if (await isHittingUserSyncRateLimit(targetUser.id)) {
        interaction.followUp({
            content: `I've updated ${targetUser.tag}'s data recently! Please try again later!`,
            ephemeral: true,
        });
        return;
    }

    // Delegate to Suzume
    let responseBody;
    try {
        responseBody = await login(targetUser.id);
    } catch (err) {
        console.error("Failed lambda call", err);
        interaction.followUp({
            content: "Uh oh! Looks like Suzume messed up!",
            ephemeral: true,
        });
        return;
    }

    // If falsey, it means Suzume didn't find a state file associated with the discord user
    if (!responseBody) {
        interaction.followUp({
            content: `I don't have account data for ${targetUser.tag}!`,
            ephemeral: true,
        });
        return;
    }

    // Write to spreadsheet
    try {
        // We should use target here but `isInSameClan` guarantees that member is OK
        const config = determineClanConfig(interaction.member);
        await updateSpreadsheet(config.name, responseBody);
    } catch (err) {
        console.error("Failed updating spreadsheet", err);
        interaction.followUp({
            content: "Oh no! I was writing down the data from Suzume but the sheets got blown away by the wind!",
            ephemeral: true,
        });
        return;
    }

    // Save to redis
    await setUserData(targetUser.id, responseBody);
    await setUserSyncTimestamp(targetUser.id, new Date().getTime());

    // Report back successful update
    const username = responseBody.user_info.user_name;
    const accountId = responseBody.user_info.viewer_id;
    console.info(`Successfully logged in to Discord User ${targetUser.tag} to account id ${accountId} with username ${username}.`);
    interaction.followUp({
        content: `I have updated Google Spreadsheet for ${targetUser.tag} / ${username} (${accountId})!`,
        ephemeral: true,
    });
}

const syncSubCommand = new SlashCommandSubcommandBuilder()
    .setName("sync")
    .setDescription("Synchronizes account data of a discord user")
    .addUserOption(option =>
        option
        .setName("target")
        .setDescription("The discord user whose account should be synchronized"))

module.exports = {
    syncFunc,
    syncSubCommand,
}