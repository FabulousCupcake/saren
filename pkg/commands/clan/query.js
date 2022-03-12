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

    // 2. Fetch last sync response body
    const clanMembersData = clanMembers.map(async (cm) => ({
        member: cm,
        data: await getUserData(cm.id),
    }));

    console.log('debug');
    console.log(typeof clanMembersData[0].data);
    console.log(clanMembersData[0].data);

    // 3. Run jsonpath query against all data
    let queryResults;
    try {
        queryResults = clanMembersData.map(cmd => ({
            member: cmd.member,
            data: jsonpath.query(cmd.data, jsonpathQuery),
        }));
    } catch (err) {
        console.error("Failed running jsonpath query", jsonpathQuery, err);
        return interaction.followUp({
            content: "Failed executing query!",
            ephemeral: true,
        });
    }

    // 4. Build message
    let index = 0;
    const messages = await Promise.all(queryResults.map(async (qr) => {
        index++;
        const message = [];
        const data = JSON.stringify(qr.data, null, 2);
        if (data.length > 100) {
            data = "Too Large!";
        }

        line.push(`${index}.`);
        line.push(`<@!${qr.member.id}>\n`);
        line.push(`\`\`\`json\n${data}\n\`\`\``)

        return message.join(" ");
    }));

    interaction.followUp({
        content: await messages.join("\n\n"),
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