const { Client, Intents } = require("discord.js");
const { createClient } = require("redis");

const link = require("./pkg/commands/link");
const unlink = require("./pkg/commands/unlink");
const status = require("./pkg/commands/status");
const sync = require("./pkg/commands/sync");

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

  const command = options.getSubcommand();

  switch(command) {
    case "link":
      await link(interaction);
      break;
    case "unlink":
      await unlink(interaction);
      break;
    case "status":
      await status(interaction);
      break;
    case "sync":
      await sync(interaction);
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
