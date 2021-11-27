const { Client, Intents } = require('discord.js');
const redis = require("redis");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const readyHandler = () => {
  console.log(`Logged in as ${client.user.tag}!`);
};

const handler = async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
};

const main = async () => {
  const redisClient = redis.createClient(process.env.REDIS_URL);

  client.on('ready', readyHandler);
  client.on('interactionCreate', handler);
  client.login(TOKEN);
}

main();
