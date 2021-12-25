const https = require('https');
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember } = require("../../acl/acl.js");
const { getArmoryText, getUserData, getUserSyncTimestamp } = require("../../redis/redis.js");
const { relatime } = require("../../utils/format.js");
const { transformToArmorySerializationText } = require("./armory.js");

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

    return {
        allowed: true,
        reason: "Can be called by any clan member against anyone"
    }
};

const generateShortURL = armoryText => {
    const generateUUID = () => {
        let uuid = "";
        while (uuid.length < 8) {
            digit = parseInt(Math.random() * 16, 10).toString(16);
            uuid += digit;
        }
        return uuid;
    };
    const uuid = generateUUID();

    const payload = JSON.stringify({
        teamList: armoryText,
        uuid: uuid,
    });

    const options = {
        hostname: "pcredivewiki.tw",
        port: 443,
        path: "/static/php/mysqlAdd.php",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": payload.length,
        },
        timeout: 3000,
    };

    const promise = new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            res.on("end", () => resolve(`https://pcredivewiki.tw/Armory?s=${uuid}`));
        });
        req.on("error", () => reject(""));
        req.write(payload);
        req.end();
    });

    return promise;
}

const generateArmoryTextFunc = async (interaction) => {
    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.followUp({
        content: reason,
        ephemeral: true,
    });

    // Determine target
    const targetUser = interaction.options.getUser("target") || interaction.member.user;

    // Fetch last sync response body
    const responseBody = await getUserData(targetUser.id);
    if (!responseBody) {
        interaction.followUp({
            content: "I can't find your data! Please run sync first and try again!",
            ephemeral: true,
        });
        return;
    }

    // Get last sync timestamp and transform into relative time format
    const currentTimestamp = new Date().getTime();
    const lastSyncTimestamp = await getUserSyncTimestamp(targetUser.id);
    const timestamp = relatime(lastSyncTimestamp - currentTimestamp);

    // Generate armory text
    const armoryTargetText = await getArmoryText(targetUser.id);
    const armoryText = transformToArmorySerializationText(responseBody, armoryTargetText);

    // Try to make short URL
    // const shortURL = await generateShortURL(armoryText);
    const shortURL = "https://google.com"

    // Build embed
    const messageEmbed = new MessageEmbed()
        .setAuthor(targetUser.username, targetUser.avatarURL())
        .setDescription(armoryText)
        .setColor("F55291")
        .setFooter(`Generated with data from ${timestamp}`);

    // Build message commponent
    const components = [];
    if (shortURL) {
        const component = new MessageButton()
            .setURL(shortURL)
            .setLabel('Open in Armory')
            .setStyle('LINK')
        const componentRow = new MessageActionRow().addComponents(component);
        components.push(componentRow)
    }

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
    .setDescription("Generates pcredivewiki.tw armory import text.")
    .addUserOption(option =>
        option
        .setName("target")
        .setDescription("The discord user whose account data should be exported")
        .setRequired(false))

module.exports = {
    generateArmoryTextFunc,
    generateArmoryTextSubCommand,
}