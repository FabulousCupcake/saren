const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember, isCalledByClanAdmin, determineClanConfig } = require("../../acl/acl.js");
const { setUserSyncTimestamp, setUserData } = require("../../redis/redis.js");
const { isHittingGlobalSyncRateLimit, isHittingUserSyncRateLimit } = require("../../redis/ratelimit.js");
const { updateSpreadsheet } = require("../../sheets/sheets.js");
const { login } = require("../../lambda/lambda.js");

const STATUS_UNKNOWN = "❓";
const STATUS_LOADING = "⚙️";
const STATUS_FAILED = "❌";
const STATUS_DONE = "✅";
const STATUS_SKIP = "⏩";
const STATUS_USER_RATELIMIT = "⏸";
const STATUS_GLOBAL_RATELIMIT = "😩";

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
            reason: "Unable to determine which clan you belong to!",
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

const clanSyncFunc = async (interaction) => {
    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.followUp({
        content: reason,
        ephemeral: true,
    });

    // TODO
    // 0. Identify Caller's Clan
    const clanConfig = determineClanConfig(interaction.member);
    if (!clanConfig) return interaction.followUp({
        content: "I don't know to which clan you belong to! I'm not doing this!",
        ephemeral: true,
    });

    // 1. Obtain ID of all discord users with Member role
    if (!interaction.guild) await interaction.client.guilds.fetch(interaction.guildId);
    const allMembers = await interaction.guild.members.fetch({ force: true });
    const clanMembers = allMembers.filter(m => m.roles.cache.has(clanConfig.memberRoleId));

    // Stop if there's >30 members
    if (clanMembers.size > 30) return interaction.followUp({
        content: "There are too many people in the clan! Please make some space, I can't work! You can use `/saren clan status` to check the member list!",
        ephemeral: true,
    });

    // This is the func that generates current sync state in text
    // We print this on start of each loop
    const status = {};
    const generateDashboardText = () => {
        let index = 0;
        const message = clanMembers.map(member => {
            index += 1;
            const line = [];
            const statusSymbol = status[member.id] || STATUS_UNKNOWN;

            line.push(statusSymbol);
            line.push(`${index}.`);
            line.push(`<@!${member.id}>`);
            return line.join(" ");
        });
        return message.join("\n");
    };

    // 2. Send initial message
    await interaction.followUp({
        content: generateDashboardText(),
        ephemeral: true,
    });

    // 3. Start looping through each clanmember, in randomized order
    const memberIds = clanMembers
        .map(m => m.id)
        .map(x => ({ v: x, s: Math.random() }))
        .sort((a, b) => a.s - b.s)
        .map(({ v }) => v);
    for (const memberId of memberIds) {
        console.log("Updating", memberId);
        status[memberId] = STATUS_LOADING;
        await interaction.editReply(generateDashboardText());

        // 3.0 Check Ratelimits
        if (await isHittingGlobalSyncRateLimit()) {
            status[memberId] = STATUS_GLOBAL_RATELIMIT;
            continue;
        }
        if (await isHittingUserSyncRateLimit(memberId)) {
            status[memberId] = STATUS_USER_RATELIMIT;
            continue;
        }

        // 3.1 Login
        let responseBody;
        try {
            responseBody = await login(memberId);
        } catch (err) {
            console.error("Failed lambda call", err);
            status[memberId] = STATUS_FAILED;
            continue;
        }

        // 3.2 Skip if no data or failed
        if (!responseBody) {
            status[memberId] = STATUS_SKIP;
            continue;
        }

        // 3.3 Push to Sheets
        try {
            await updateSpreadsheet(clanConfig.name, responseBody);
        } catch (err) {
            console.error("Failed updating spreadsheet", err);
            status[memberId] = STATUS_FAILED;
            continue;
        }

        // 3.4 Save to redis
        try {
            await setUserData(memberId, responseBody);
            await setUserSyncTimestamp(memberId, new Date().getTime());
        } catch (err) {
            console.error("Failed updating redis", err);
            status[memberId] = STATUS_FAILED;
            continue;
        }

        // 3.5 Finally done
        status[memberId] = STATUS_DONE;
    }

    await interaction.editReply(generateDashboardText());
    interaction.followUp({
        content: "I'm finished!",
        ephemeral: true,
    });
}

const clanSyncSubCommand = new SlashCommandSubcommandBuilder()
    .setName("sync")
    .setDescription("Synchronizes account data of all clan members")

module.exports = {
    clanSyncFunc,
    clanSyncSubCommand,
}