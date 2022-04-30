const { Client, Intents } = require("discord.js");

const { initializeS3Client } = require("./pkg/s3/s3.js");
const { initializeRedisClient } = require("./pkg/redis/redis.js");
const { initializeRateLimiters } = require("./pkg/redis/ratelimit.js");
const { initializeLambdaClient } = require("./pkg/lambda/lambda.js");
const { initializeSpreadsheetClient } = require("./pkg/sheets/sheets.js");
const { initializeCommands } = require("./pkg/commands");

const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });

const readyHandler = () => console.log(`Logged in as ${client.user.tag}!`);

const handler = async (interaction) => {
  // Killswitch for 25 March 2022 update
  // if (new Date().getTime() > 1648170000000) {
  //   interaction.reply({
  //     content: "I'm away on vacation! Please come again some time later!",
  //     ephemeral: true,
  //   });
  //   return;
  // }

  if (!interaction.isCommand()) return;
  if (interaction.commandName !== "saren") return;

  const subcommand = interaction.options.getSubcommand();
  const subcommandGroup = interaction.options.getSubcommandGroup(false);

  // If subcommandgroup exists, prioritize resolving that
  const command = subcommandGroup || subcommand;
  const commandFunc = client.commands.get(command);

  if (!commandFunc) {
    console.warn("Unknown command", subcommand, interaction);
    return;
  }

  // Tell discord that we ACKed
  await interaction.deferReply({ ephemeral: true });

  // Log it
  (function() {
    const Y = f => (x => x(x))(y => f(x => y(y)(x)));
    const optionsToText = Y(optionsToTextFn => options => {
      if (!options) return "";
      const content = options.map(o => {
        // Recurse if subcommand
        if (o.type == "SUB_COMMAND" || o.type == "SUB_COMMAND_GROUP") {
          const value = optionsToTextFn(o.options);
          return `${o.name}: ${value}`;
        }

        // Otherwise just return value
        return `${o.name}: ${o.value}`
      }).join(", ");

      return `[${content}]`;
    });

    const discordUserId = interaction.user.id;
    const discordUserTag = interaction.user.tag;
    const optionsText = optionsToText(interaction.options.data);

    console.info(`${discordUserId} (${discordUserTag}): ${optionsText}`);
  })();


  try {
    commandFunc(interaction);
  } catch (err) {
    interaction.followUp({
      content: "Oops! Something went wrong!",
      ephemeral: true,
    });
    console.error(err, interaction);
  }
};

const main = async () => {
  initializeS3Client();
  await initializeRedisClient();
  initializeRateLimiters();
  initializeLambdaClient();
  initializeSpreadsheetClient();
  initializeCommands(client);

  client.on("ready", readyHandler);
  client.on("interactionCreate", handler);
  client.login(TOKEN);
}

// Do not crash on error
process.on('uncaughtException', function (err) {
  console.log("!!!");
  console.error(err);
  console.log("---")
  console.error(err.stack);
  console.log("---")
});

main();
