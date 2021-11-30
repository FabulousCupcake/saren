const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember, isCalledByClanAdmin, AUTHORIZED_ROLES_LIST } = require("../acl/acl.js");
const { listStateFiles } = require("../s3/s3.js");

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

const clanStatusFunc = async (interaction) => {
    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.followUp({
        content: reason,
        ephemeral: true,
    });

    // TODO
    // 1. Obtain ID of all discord users with Vanilla Member role
    const members = (await interaction.guild.roles.fetch(AUTHORIZED_ROLES_LIST.member)).members;

    // 2. Obtain all ID in S3 (listStateFiles)
    const suzumeList = await listStateFiles();

    // 3. Compare and print explicitly who has it and who not, including number count to check if 30
    const messages = members.map((member, index) => {
        const hasStateFile = suzumeList.includes(member.id);
        const symbol = (hasStateFile) ? ":white_check_mark:" : ":x:";

        return `${symbol} ${index+1}. <@!${member.id}>`;
    });

    interaction.followUp({
        content: messages.join("\n"),
        ephemeral: true,
    });
}

const clanStatusSubCommand = new SlashCommandSubcommandBuilder()
    .setName("clanstatus")
    .setDescription("Check the link status of all clan members")

module.exports = {
    clanStatusFunc,
    clanStatusSubCommand,
}