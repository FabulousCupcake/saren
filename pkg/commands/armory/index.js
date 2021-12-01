const { SlashCommandSubcommandGroupBuilder } = require("@discordjs/builders");

const { generateArmoryTextFunc, generateArmoryTextSubCommand } = require("./generate.js");
const { importArmoryTextFunc, importArmoryTextSubCommand } = require("./import.js");

const COMMAND_MAP = {
    generate: generateArmoryTextFunc,
    import: importArmoryTextFunc,
};

const armorySubcommandGroup = new SlashCommandSubcommandGroupBuilder()
    .setName("armorytext")
    .setDescription("pcredivewiki.tw Armory related commands")
    .addSubcommand(generateArmoryTextSubCommand)
    .addSubcommand(importArmoryTextSubCommand)

const armoryGroupFunc = async (interaction) => {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    if (subcommandGroup != armorySubcommandGroup.name) {
        console.warn("Unknown command", command, interaction);
        return;
    }

    const command = interaction.options.getSubcommand();
    const commandFunc = COMMAND_MAP[command];

    if (!commandFunc) {
        console.warn("Unknown command", command, interaction);
        return;
    }

    await commandFunc(interaction);
}

module.exports = {
    armorySubcommandGroup,
    armoryGroupFunc,
}