const AUTHORIZED_USERS_LIST = {
    "owner": [
        109729829670154240,   // FabulousCupcake#7972
    ],
    "admin": [
        196976643875667968,   // baeck#7724
        149763965197484032,   // Ding Doung#0727
        172825411032449025,   // Vanella#5983
        146011061924003840,   // Kots#5257
        344223469787152395,   // Fupyy#3379
        151096152568233984,   // Chaoticlight#3995
        291962081669021697,   // F2PLoli#2021
        104776095080964096,   // Mesh#1267
        215904532960509952,   // MikeP#9333
    ],
};

const AUTHORIZED_ROLES_LIST = {
    "admin": 866363432323514368,    // Vanilla Administration
    "member": 859805729338818561,   // Vanilla
};

const isOwner = id => AUTHORIZED_USERS_LIST.owner.includes(id);
const isAdmin = id => AUTHORIZED_USERS_LIST.admin.includes(id);
const hasAdminRole = roles => roles.includes(AUTHORIZED_ROLES_LIST.admin);
const hasMemberRole = roles => roles.includes(AUTHORIZED_ROLES_LIST.member);
const isCalledByClanMember = interaction => hasMemberRole(interaction.member.roles);
const isCalledByClanAdmin = interaction => {
    if (isAdmin(interaction.user.id)) return true;
    // if (hasAdminRole(interaction.member.roles)) return true;
    return false;
}

const isTargetAllowed = interaction => {
    const targetUser = interaction.options.getUser("target");
    const callerUser = interaction.user;
    const callerRoles = interaction.member.roles;

    // If target is self, then it's good
    if (targetUser.id === callerUser.id) return true;

    // If target is others, caller must be admin
    if (hasAdminRole(callerRoles)) return true;
    if (isAdmin(callerUser)) return true;
    if (isOwner(callerUser)) return true;
    return false
}

const targetIsCaller = interaction => {
    const targetUser = interaction.options.getUser("target");
    const callerUser = interaction.user;
    return targetUser.id === callerUser.id;
}

module.exports = {
    AUTHORIZED_USERS_LIST,
    AUTHORIZED_ROLES_LIST,
    isOwner,
    isAdmin,
    hasAdminRole,
    hasMemberRole,
    isCalledByClanMember,
    isCalledByClanAdmin,
    isTargetAllowed,
    targetIsCaller,
}