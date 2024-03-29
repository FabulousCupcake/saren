const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { SlashCommandBuilder } = require("@discordjs/builders");

const { clanConfigs, ownerDiscordId } = require("../pkg/config/config");
const { linkSubCommand } = require("../pkg/commands/link.js");
const { unlinkSubCommand } = require("../pkg/commands/unlink.js");
const { sheetSubCommand } = require("../pkg/commands/sheet.js");
const { statusSubCommand } = require("../pkg/commands/status.js");
const { syncSubCommand } = require("../pkg/commands/sync.js");
const { clanSubcommandGroup } = require("../pkg/commands/clan");
const { armorySubcommandGroup } = require("../pkg/commands/armory");

const { armoryCopyContextMenuCommand } = require ("../pkg/contextmenus/armory-copy");

// Constants
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const SLASH_COMMAND = new SlashCommandBuilder()
  .setName("saren")
  .setDescription("Princess Connect! Re:Dive Credentials Management Bot")
  .setDefaultPermission(false)
  .addSubcommand(linkSubCommand)
  .addSubcommand(unlinkSubCommand)
  .addSubcommand(sheetSubCommand)
  .addSubcommand(statusSubCommand)
  .addSubcommand(syncSubCommand)
  .addSubcommandGroup(clanSubcommandGroup)
  .addSubcommandGroup(armorySubcommandGroup)
  .toJSON()

const CONTEXT_MENU_COMMANDS = [
  armoryCopyContextMenuCommand.toJSON(),
];

const COMMANDS = [
  SLASH_COMMAND,
  ...CONTEXT_MENU_COMMANDS,
];

const PERMISSIONS = [
  {
    id: ownerDiscordId,
    type: 2,
    permission: true,
  },
  ...clanConfigs.map(clan => ({
    id: clan.memberRoleId,
    type: 1,
    permission: true,
  })),
];

// Globals
const rest = new REST({ version: '9' }).setToken(TOKEN);

// registerCommands registers command json and returns command id
const registerCommands = async () => {
  console.log("==> Command JSON:");
  console.log(JSON.stringify(COMMANDS, null, 2));

  console.log('==> Registering slash commands...');
  const res = await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: COMMANDS },
  );
  console.log('==> Successfully registered slash commands!');

  return res[0].id;
};

// adjustPermissions sets command permission
const adjustPermissions = async (commandId) => {
  console.log("==> Permissions JSON:");
  console.log(JSON.stringify(PERMISSIONS, null, 2));

  console.log("==> Adjusting slash command permission");
  await rest.put(
    Routes.applicationCommandPermissions(CLIENT_ID, GUILD_ID, commandId),
    { body: { permissions: PERMISSIONS } },
  );
  console.log("==> Successfully adjusted slash command permissions!");
};

// Main
(async () => {
  // Register Commands
  try {
    const commandId = await registerCommands();
    await adjustPermissions(commandId);
  } catch (error) {
    console.error(error);
    throw error;
  }
})();