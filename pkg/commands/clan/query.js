const jsonpath = require("jsonpath");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, determineClanConfig } = require("../../acl/acl.js");
const { getUserData } = require("../../redis/redis.js");

const checkPermissions = interaction => {
    if (isCalledByOwner(interaction)) {
        return {
            allowed: true,
            reason: "Caller is application owner",
        };
    }

    return {
        allowed: false,
        reason: "You are not allowed to do this!"
    }
};

const clanQueryFunc = async (interaction) => {
    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.followUp({
        content: reason,
        ephemeral: true,
    });

    const jsonpathQuery = interaction.options.getString("query");

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

    // 2. Fetch last sync response body and query
    let queryResults = [];

    const memberIds = clanMembers
        .map(m => m.id)
        .map(x => ({ v: x, s: Math.random() }))
        .sort((a, b) => a.s - b.s)
        .map(({ v }) => v);
    for (const memberId of memberIds) {
        const data = await getUserData(memberId);

        // No data / non linked members
        if (!data) {
            queryResults.push({
                id: memberId,
                data: "No Data",
            });
            continue;
        }

        // Run jsonpath query
        let queriedData;
        try {
            queriedData = jsonpath.query(data, jsonpathQuery)[0];
        } catch (err) {
            console.error("Failed running jsonpath query", jsonpathQuery, err);
            return interaction.followUp({
                content: `Failed executing query!\n${err.message}`,
                ephemeral: true,
            });
        }

        // If Object, Stringify and wrap in codeblock
        if (typeof queriedData === "object") {
            queriedData = JSON.stringify(queriedData, null, 2);
            queriedData = `\n\`\`\`json\n${queriedData}\`\`\``;
        } else {
            queriedData = `\`${queriedData}\``;
        }

        // Check if too large
        if (queriedData.length > 65) {
            queriedData = "Too Large!";
        }

        // Push to results list
        queryResults.push({
            id: memberId,
            data: queriedData,
        });
    }

    // 3. Build message
    let index = 0;
    const messages = await Promise.all(queryResults.map(async (qr) => {
        index++;
        const message = [];
        message.push(`${index}.`);
        message.push(`<@!${qr.id}>:`);
        message.push(qr.data);

        return message.join(" ");
    }));

    interaction.followUp({
        content: await messages.join("\n"),
        ephemeral: true,
    });
}

const clanQuerySubCommand = new SlashCommandSubcommandBuilder()
    .setName("query")
    .setDescription("Run a jsonpath query against all clan member data in Redis")
    .addStringOption(option =>
        option
        .setName("query")
        .setDescription("The jsonpath query to be run against all clan member data in Redis")
        .setRequired(true))

module.exports = {
    clanQueryFunc,
    clanQuerySubCommand,
}