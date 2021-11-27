const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const COMMANDS = [{
  name: 'ping',
  description: 'Replies with Pong!'
}];

const rest = new REST({ version: '9' }).setToken(TOKEN);
(async () => {
  try {
    console.log('Refreshing application slash commands...');
    console.log(JSON.stringify(COMMANDS, null, 2));

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: COMMANDS },
    );

    console.log('Successfully registered application slash commands!');
  } catch (error) {
    console.error(error);
  }
})();
