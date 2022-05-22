const https = require('https');
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember } = require("../../acl/acl.js");
const { getArmoryText, getUserData, getUserSyncTimestamp } = require("../../redis/redis.js");
const { relatime } = require("../../utils/format.js");
const { transformToArmorySerializationText } = require("./armory.js");

const checkPermissions = async (interaction) => {
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

    // if (! await isInSameClan(interaction)) {
    //     return {
    //         allowed: false,
    //         reason: "You can only target members of your clan!"
    //     }
    // }

    return {
        allowed: true,
        reason: "Can be called by any clan member against anyone"
    }
};

// generateShortURL sends a request to pcredivewiki to save armorytext
const generateShortURL = armoryText => {
    // weirdly enough **we** decide the uuid, 8 characters length, hex characters
    const generateUUID = () => {
        let uuid = "";
        while (uuid.length < 8) {
            digit = parseInt(Math.random() * 16, 10).toString(16);
            uuid += digit;
        }
        return uuid;
    };
    const uuid = generateUUID();

    // Build x-www-form-urlencoded payload
    const usp = new URLSearchParams()
    usp.append("teamList", armoryText);
    usp.append("uuid", uuid);
    const payload = usp.toString();

    // Build https options
    const options = {
        hostname: "pcredivewiki.tw",
        path: "/static/php/mysqlAdd.php",
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": payload.length,
        },
        timeout: 1000,
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            if (res.statusCode != "200") reject();
            resolve(`https://pcredivewiki.tw/Armory?s=${uuid}`);
        });
        req.on("error", err => {
            console.error(err);
            resolve()
        });
        req.on("timeout", () => {
            console.error("timed out");
            req.destroy();
            resolve();
        });
        req.end(payload);
    });
}

const generateArmoryTextFunc = async (interaction) => {
    const { allowed, reason } = await checkPermissions(interaction);
    if (!allowed) return interaction.followUp({
        content: reason,
        ephemeral: true,
    });

    // Determine target & account
    const accountDataUser = interaction.options.getUser("account") || interaction.member.user;
    const targetRankUser = interaction.options.getUser("target") || accountDataUser;

    // Fetch last sync response body
    const responseBody = await getUserData(accountDataUser.id);
    if (!responseBody) {
        interaction.followUp({
            content: "I can't find your data! Please run sync first and try again!",
            ephemeral: true,
        });
        return;
    }

    // Get last sync timestamp and transform into relative time format
    const currentTimestamp = new Date().getTime();
    const lastSyncTimestamp = await getUserSyncTimestamp(accountDataUser.id);
    const timestamp = relatime(lastSyncTimestamp - currentTimestamp);

    // Generate armory text
    const armoryTargetText = await getArmoryText(targetRankUser.id);
    const armoryText = transformToArmorySerializationText(responseBody, armoryTargetText);

    // Build message component
    const shortURL = await generateShortURL(armoryText);
    const components = [];
    if (shortURL) {
        const component = new MessageButton()
            .setURL(shortURL)
            .setLabel('Open in Armory')
            .setStyle('LINK')
        const componentRow = new MessageActionRow().addComponents(component);
        components.push(componentRow)
    }

    // Build embed
    const messageEmbed = new MessageEmbed({
        author: {
            name: accountDataUser.username,
            iconURL: accountDataUser.avatarURL()
        },
        description: armoryText,
        color: "F55291",
        footer: {
            text: `Generated with data from ${timestamp}`
        },
    });

    // Send reply
    interaction.followUp({
        content: "Here you go!",
        embeds: [ messageEmbed ],
        components: components,
        ephemeral: true,
    });
}

const generateArmoryTextSubCommand = new SlashCommandSubcommandBuilder()
    .setName("generate")
    .setDescription("Generates pcredivewiki.tw armory text")
    .addUserOption(option =>
        option
        .setName("account")
        .setDescription("The discord user whose account data should be exported")
        .setRequired(false))
    .addUserOption(option =>
        option
        .setName("target")
        .setDescription("A discord user whose armory target ranks data should be used")
        .setRequired(false))

module.exports = {
    generateArmoryTextFunc,
    generateArmoryTextSubCommand,
}