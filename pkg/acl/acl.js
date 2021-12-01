const AUTHORIZED_USERS_LIST = {
    "owner": [
        "109729829670154240",   // FabulousCupcake#7972
    ],
    "admin": [
        "196976643875667968",   // baeck#7724
        "149763965197484032",   // Ding Doung#0727
        "172825411032449025",   // Vanella#5983
        "146011061924003840",   // Kots#5257
        "344223469787152395",   // Fupyy#3379
        "151096152568233984",   // Chaoticlight#3995
        "291962081669021697",   // F2PLoli#2021
        "104776095080964096",   // Mesh#1267
        "215904532960509952",   // MikeP#9333
    ],
};

const AUTHORIZED_ROLES_LIST = {
    "admin": "866363432323514368",    // Vanilla Administration
    "member": "859805729338818561",   // Vanilla
};

const isCalledByOwner = interaction => {
    if (AUTHORIZED_USERS_LIST.owner.includes(interaction.user.id)) return true;

    return false;
}

const isCalledByClanMember = interaction => {
    if (interaction.member.roles.has(AUTHORIZED_ROLES_LIST.member)) return true;

    return false
}

const isCalledByClanAdmin = interaction => {
    // Check ID
    if (!AUTHORIZED_USERS_LIST.admin.includes(interaction.user.id)) return true;

    // Check Role
    if (interaction.member.roles.has(AUTHORIZED_ROLES_LIST.admin)) return true;

    return false;
}

const targetIsCaller = interaction => {
    const targetUser = interaction.options.getUser("target");
    const callerUser = interaction.user;
    return targetUser.id === callerUser.id;
}

module.exports = {
    AUTHORIZED_USERS_LIST,
    AUTHORIZED_ROLES_LIST,
    isCalledByOwner,
    isCalledByClanMember,
    isCalledByClanAdmin,
    targetIsCaller,
}