const { Client, Intents } = require("discord.js");
const { createClient } = require("redis");

const { linkFunc } = require("./pkg/commands/link");
const { unlinkFunc } = require("./pkg/commands/unlink");
const { statusFunc } = require("./pkg/commands/status");
const { syncFunc } = require("./pkg/commands/sync");

const TOKEN = process.env.DISCORD_TOKEN;
// const CLIENT_ID = process.env.CLIENT_ID;
// const GUILD_ID = process.env.GUILD_ID;

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const redisClient = createClient(process.env.REDIS_URL);

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
  client.on("ready", readyHandler);
  client.on("interactionCreate", handler);
  client.login(TOKEN);
}

main();
