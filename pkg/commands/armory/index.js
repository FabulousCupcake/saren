const { SlashCommandSubcommandGroupBuilder } = require("@discordjs/builders");

const { generateArmoryTextSubCommand } = require("./generate.js");
const { importArmoryTextSubCommand } = require("./import.js");

const armorySubcommandGroup = new SlashCommandSubcommandGroupBuilder()
    .setName("armorytext")
    .setDescription("pcredivewiki.tw Armory related commands")
    .addSubcommand(generateArmoryTextSubCommand)
    .addSubcommand(importArmoryTextSubCommand)

module.exports = {
    armorySubcommandGroup,
}