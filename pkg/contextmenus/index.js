const { Collection } = require('discord.js');

const { armoryCopyFunc, armoryCopyContextMenuCommand } = require("./armory-copy");

const initializeContextMenus = client => {
  if (!client.commands) {
    client.commands = new Collection();
  }

  client.commands.set(armoryCopyContextMenuCommand.name, armoryCopyFunc);
}

module.exports = {
  initializeContextMenus,
}