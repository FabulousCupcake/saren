const { clanConfigs, ownerDiscordId } = require("../config/config");

// Returns the clan config of the respective clan
// returns false instead if part of >1 clan
const determineClanConfig = member => {
    const configs = clanConfigs.filter(clan => {
        return member.roles.cache.has(clan.memberRoleId);
    });
    console.debug(`acl: ${member.user.tag} is part of: ${configs.map(c => c.name)}`);

    // In 0 clan, refuse
    if (configs.length === 0) return false;

    // In >1 clan, refuse
    if (configs.length > 1) return false;

    return configs[0];
}

const isCalledByOwner = interaction => {
    if (interaction.user.id == ownerDiscordId) return true;

    return false;
}

const isCalledByClanMember = interaction => {
    const config = determineClanConfig(interaction.member);
    if (!config) return false;

    return interaction.member.roles.cache.has(config.memberRoleId);
}

const isCalledByClanAdmin = interaction => {
    const config = determineClanConfig(interaction.member);
    if (!config) return false;

    return interaction.member.roles.cache.has(config.adminRoleId);
}

// isInSameClan ensures caller and target are from the same clan
// We do this in `checkPermission` of every commnand that needs it
//   This guarantees that target uses the same config, so we don't need to check and fetch manually again
//   Especially in places where we update sheet and need to obtain sheet id from config
const isInSameClan = async (interaction) => {
    const targetUser = interaction.options.getUser("target");
    console.log("targetuser", targetUser.id);

    // If target is unspecified return true
    if (!targetUser) return true;

    // User option does not provide role data, so we need to look it from guild members
    if (!interaction.guild) await interaction.client.guilds.fetch(interaction.guildId);
    const targetMember = await interaction.guild.members.fetch({ force: true, user: targetUser });

    console.log("targetmember", targetMember.id);

    const callerConfig = determineClanConfig(interaction.member);
    const targetConfig = determineClanConfig(targetMember);

    console.log(callerConfig, targetConfig);

    return (callerConfig.name === targetConfig.name);
}

const targetIsCaller = interaction => {
    const targetUser = interaction.options.getUser("target");

    // If target is unspecified, allow it — it probably assumes target is caller.
    if (!targetUser) return true;

    const callerUser = interaction.user;
    return targetUser.id === callerUser.id;
}

module.exports = {
    determineClanConfig,
    isCalledByOwner,
    isCalledByClanMember,
    isCalledByClanAdmin,
    isInSameClan,
    targetIsCaller,
}