const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

const { isCalledByOwner, isCalledByClanMember } = require("../../acl/acl.js");
const { getArmoryText } = require("../../redis/redis.js");
const { login } = require("../../lambda/lambda.js");
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
        reason: "Caller can only be self"
    }
};

const generateArmoryTextFunc = async (interaction) => {
    const { allowed, reason } = checkPermissions(interaction);
    if (!allowed) return interaction.followUp({
        content: reason,
        ephemeral: true,
    });

    let responseBody;
    try {
        const response = await login(interaction.member.id);
        responseBody = JSON.parse(Buffer.from(response.Payload).toString());
    } catch (err) {
        console.error("Failed lambda call", err);
        interaction.followUp({
            content: "Uh oh! Looks like Suzume messed up!",
            ephemeral: true,
        });
        return;
    }

    // If falsey, it means Suzume didn't find a state file associated with the discord user
    if (!responseBody) {
        interaction.followUp({
            content: `I don't have account data for ${interaction.member.user.tag}!`,
            ephemeral: true,
        });
        return;
    }

    const armoryTargetText = await getArmoryText(interaction.member.id);
    const armoryText = transformToArmorySerializationText(responseBody, armoryTargetText);
    interaction.followUp({
        content: `Thank you for waiting! Here you go!\n\`\`\`${armoryText}\`\`\``,
        ephemeral: true,
    });
}

const generateArmoryTextSubCommand = new SlashCommandSubcommandBuilder()
    .setName("generate")
    .setDescription("Generates pcredivewiki.tw armory import text.")

module.exports = {
    generateArmoryTextFunc,
    generateArmoryTextSubCommand,
}