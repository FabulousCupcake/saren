const { Client, Intents } = require("discord.js");

const { initializeReditClient } = require("./pkg/redis/redis.js");
const { initializeLambdaClient } = require("./pkg/lambda/lambda.js");
const { initializeSpreadsheetClient } = require("./pkg/sheets/sheets.js");
const { linkFunc } = require("./pkg/commands/link");
const { unlinkFunc } = require("./pkg/commands/unlink");
const { statusFunc } = require("./pkg/commands/status");
const { syncFunc } = require("./pkg/commands/sync");

const TOKEN = process.env.DISCORD_TOKEN;
// const CLIENT_ID = process.env.CLIENT_ID;
// const GUILD_ID = process.env.GUILD_ID;

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const readyHandler = () => {
  console.log(`Logged in as ${client.user.tag}!`);
};

const handler = async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName !== "saren") return;

  const command = interaction.options.getSubcommand();

  switch(command) {
    case "link":
      await linkFunc(interaction);
      break;
    case "unlink":
      await unlinkFunc(interaction);
      break;
    case "status":
      await statusFunc(interaction);
      break;
    case "sync":
      await syncFunc(interaction);
      break;
    default:
      console.warn(`Unknown command: ${command}`);
  }
};

const main = async () => {
  initializeReditClient();
  initializeLambdaClient();
  initializeSpreadsheetClient();
  client.on("ready", readyHandler);
  client.on("interactionCreate", handler);
  client.login(TOKEN);
}

main();
