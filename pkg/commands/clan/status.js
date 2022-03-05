const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember, isCalledByClanAdmin, determineClanConfig } = require("../../acl/acl.js");
const { getUserSyncTimestamp } = require("../../redis/redis.js");
const { listStateFiles } = require("../../s3/s3.js");
const { relatime } = require("../../utils/format.js");

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

const clanStatusFunc = async (interaction) => {
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

    // 2. Obtain all ID in S3 (listStateFiles)
    const suzumeList = await listStateFiles();

    // 3. Compare and print explicitly who has it and who not, including number count to check if 30
    const currentTimestamp = new Date().getTime();
    let index = 0;
    const messages = await Promise.all(clanMembers.map(async (member) => {
        index++;
        const message = [];

        const hasStateFile = suzumeList.includes(member.id);
        const symbol = (hasStateFile) ? "✅" : "❌";

        message.push(symbol);
        message.push(`${index}.`);
        message.push(`<@!${member.id}>`);

        const lastSyncTimestamp = await getUserSyncTimestamp(member.id);
        if (hasStateFile) {
            if (lastSyncTimestamp) {
                message.push(`(${relatime(lastSyncTimestamp - currentTimestamp)})`);
            } else {
                message.push("(I'm not sure when!)");
            }
        }

        return message.join(" ");
    }));

    interaction.followUp({
        content: await messages.join("\n"),
        ephemeral: true,
    });
}

const clanStatusSubCommand = new SlashCommandSubcommandBuilder()
    .setName("status")
    .setDescription("Check the link status of all clan members")

module.exports = {
    clanStatusFunc,
    clanStatusSubCommand,
}