const { Client, Intents } = require("discord.js");

const { initializeS3Client } = require("./pkg/s3/s3.js");
const { initializeReditClient } = require("./pkg/redis/redis.js");
const { initializeLambdaClient } = require("./pkg/lambda/lambda.js");
const { initializeSpreadsheetClient } = require("./pkg/sheets/sheets.js");

const { linkFunc } = require("./pkg/commands/link");
const { unlinkFunc } = require("./pkg/commands/unlink");
const { statusFunc } = require("./pkg/commands/status");
const { syncFunc } = require("./pkg/commands/sync");
const { clanStatusFunc } = require("./pkg/commands/clan-status");

const TOKEN = process.env.DISCORD_TOKEN;

const COMMAND_MAP = {
  link: linkFunc,
  unlink: unlinkFunc,
  status: statusFunc,
  sync: syncFunc,
  clanstatus: clanStatusFunc,
};

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });

const readyHandler = () => console.log(`Logged in as ${client.user.tag}!`);

const handler = async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName !== "saren") return;

  const command = interaction.options.getSubcommand();
  const commandFunc = COMMAND_MAP[command];

  if (!commandFunc) {
    console.warn("Unknown command", command, interaction);
    return;
  }

  // Tell discord that we ACKed
  interaction.deferReply({ ephemeral: true });

  try {
    commandFunc(interaction);
  } catch (err) {
    interaction.followUp("Oops! Something went wrong!");
    console.error(err, interaction);
  }
};

const main = async () => {
  initializeS3Client();
  initializeReditClient();
  initializeLambdaClient();
  initializeSpreadsheetClient();

  client.on("ready", readyHandler);
  client.on("interactionCreate", handler);
  client.login(TOKEN);
}

main();
