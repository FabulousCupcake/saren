const { Client, Intents } = require("discord.js");

const { initializeS3Client } = require("./pkg/s3/s3.js");
const { initializeRedisClient } = require("./pkg/redis/redis.js");
const { initializeRateLimiters } = require("./pkg/redis/ratelimit.js");
const { initializeLambdaClient } = require("./pkg/lambda/lambda.js");
const { initializeSpreadsheetClient } = require("./pkg/sheets/sheets.js");
const { initializeCommands } = require("./pkg/commands");
const { initializeContextMenus } = require("./pkg/contextmenus");

const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });

const readyHandler = () => console.log(`Logged in as ${client.user.tag}!`);

const commandHandler = async (interaction) => {
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
}

const contextMenuHandler = async (interaction) => {
  const commandName = interaction.commandName;
  const commandFunc = client.commands.get(commandName);

  if (!commandFunc) {
    console.warn("Unknown command", subcommand, interaction);
    return;
  }

  // Tell discord that we ACKed
  await interaction.deferReply({ ephemeral: true });

  // Log it
  const discordUserId = interaction.user.id;
  const discordUserTag = interaction.user.tag;
  console.info(`${discordUserId} (${discordUserTag}): ${commandName} ${interaction.targetUser.id}`);

  // Exec it
  try {
    commandFunc(interaction);
  } catch (err) {
    interaction.followUp({
      content: "Oops! Something went wrong!",
      ephemeral: true,
    });
    console.error(err, interaction);
  }
}

const handler = async (interaction) => {
  // Killswitch for 25 March 2022 update
  // if (new Date().getTime() > 1648170000000) {
  //   interaction.reply({
  //     content: "I'm away on vacation! Please come again some time later!",
  //     ephemeral: true,
  //   });
  //   return;
  // }

  if (!interaction.isApplicationCommand()) return;

  console.log("is command?", interaction.isCommand());
  console.log("is context menu?", interaction.isContextMenu());
  console.log("is user context menu?", interaction.isUserContextMenu());

  if (interaction.isCommand()) {
    return await commandHandler(interaction);
  }

  if (interaction.isContextMenu()) {
    return await contextMenuHandler(interaction);
  }

  return;
};

const main = async () => {
  initializeS3Client();
  await initializeRedisClient();
  initializeRateLimiters();
  initializeLambdaClient();
  initializeSpreadsheetClient();
  initializeCommands(client);
  initializeContextMenus(client);

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
