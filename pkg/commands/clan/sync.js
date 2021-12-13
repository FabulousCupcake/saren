const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { setTimeout } = require("timers/promises");

const { isCalledByOwner, isCalledByClanMember, isCalledByClanAdmin, AUTHORIZED_ROLES_LIST } = require("../../acl/acl.js");
const { setUserSyncTimestamp, setUserData } = require("../../redis/redis.js");
const { login } = require("../../lambda/lambda.js");

const STATUS_UNKNOWN = "❓";
const STATUS_LOADING = "⚙️";
const STATUS_FAILED = "❌";
const STATUS_DONE = "✅";
const STATUS_SKIP = "⏩";

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
    // 1. Obtain ID of all discord users with Vanilla Member role
    if (!interaction.guild) await interaction.client.guilds.fetch(interaction.guildId);
    const allMembers = await interaction.guild.members.fetch({ force: true });
    const clanMembers = allMembers.filter(m => m.roles.cache.has(AUTHORIZED_ROLES_LIST.member));

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

    // 3. Start looping through each clanmember
    for (const member of clanMembers) {
        const memberId = member[0]; // Using for of returns a very weird… thing
        console.log(memberId);
        console.log(status);
        status[memberId] = STATUS_LOADING;
        await interaction.editReply(generateDashboardText());

        // 3.1 Login
        // let responseBody;
        // try {
        //     const response = await login(targetUser.id);
        //     responseBody = JSON.parse(Buffer.from(response.Payload).toString());
        // } catch (err) {
        //     console.error("Failed lambda call", err);
        //     status[member.id] = STATUS_SKIP;
        //     return;
        // }

        // // 3.2 Skip if no data or failed
        // if (!responseBody) {
        //     status[member.id] = STATUS_SKIP;
        //     return;
        // }

        // // 3.3 Push to Sheets
        // try {
        //     await updateSpreadsheet(responseBody);
        // } catch (err) {
        //     console.error("Failed updating spreadsheet", err);
        //     status[member.id] = STATUS_SKIP;
        //     return;
        // }

        // // 3.4 Save to redis
        // try {
        //     await setUserData(targetUser.id, responseBody);
        //     await setUserSyncTimestamp(targetUser.id, new Date().getTime());
        // } catch (err) {
        //     console.error("Failed updating redis", err);
        //     status[member.id] = STATUS_SKIP;
        //     return;
        // }

        await setTimeout(2000);

        // 3.5 Finally done
        status[member.id] = STATUS_DONE;
    }

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