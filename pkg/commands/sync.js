const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember, isCalledByClanAdmin, targetIsCaller } = require("../acl/acl.js");
const { updateSpreadsheet } = require("../sheets/sheets.js");
const { setArmoryText, setUserSyncTimestamp } = require("../redis/redis.js");
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
    if (!allowed) return interaction.followUp({
        content: reason,
        ephemeral: true,
    });

    // TODO: Clan battle toggle check
    // Make it harder to accidantally sync during CB, requiring explicit approval/confirmation
    // Either via Message Component button
    //     or via required boolean (ehh)

    const targetUser = interaction.options.getUser("target");

    let responseBody;
    try {
        const response = await login(targetUser.id);
        responseBody = JSON.parse(Buffer.from(response.Payload).toString());
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
        await updateSpreadsheet(responseBody);
    } catch (err) {
        console.error("Failed updating spreadsheet", err);
        interaction.followUp({
            content: "Oh no! I was writing down the data from Suzume but the sheets got blown away by the wind!",
            ephemeral: true,
        });
        return;
    }

    // Save to redis
    await setArmoryText(targetUser.id, responseBody);
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
        .setDescription("The discord user whose account should be synchronized")
        .setRequired(true))

module.exports = {
    syncFunc,
    syncSubCommand,
}