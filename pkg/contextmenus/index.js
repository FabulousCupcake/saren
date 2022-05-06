const { Collection } = require('discord.js');

const { armoryCopyFunc, armoryCopyContextMenuCommand } = require("./armory-copy");

const initializeContextMenus = client => {
    client.commands = new Collection();
    client.commands.set(armoryCopyContextMenuCommand.name, armoryCopyFunc);
}

module.exports = {
  initializeContextMenus,
}