const { SlashCommandSubcommandGroupBuilder } = require("@discordjs/builders");

const { clanStatusFunc, clanStatusSubCommand } = require("./status.js");
const { clanQueryFunc, clanQuerySubCommand } = require("./query.js");
const { clanSyncFunc, clanSyncSubCommand } = require("./sync.js");

const COMMAND_MAP = {
    status: clanStatusFunc,
    query: clanQueryFunc,
    sync: clanSyncFunc,
};

const clanSubcommandGroup = new SlashCommandSubcommandGroupBuilder()
    .setName("clan")
    .setDescription("Clan-wide commands")
    .addSubcommand(clanStatusSubCommand)
    .addSubcommand(clanQuerySubCommand)
    .addSubcommand(clanSyncSubCommand)

const clanGroupFunc = async (interaction) => {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    if (subcommandGroup != clanSubcommandGroup.name) {
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
    clanSubcommandGroup,
    clanGroupFunc,
}