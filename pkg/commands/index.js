const { Collection } = require('discord.js');

const { linkFunc } = require("./link");
const { unlinkFunc } = require("./unlink");
const { sheetFunc } = require("./sheet");
const { statusFunc } = require("./status");
const { syncFunc } = require("./sync");

const { armoryGroupFunc } = require("./armory");
const { clanGroupFunc } = require("./clan");

const initializeCommands = client => {
  if (!client.commands) {
    client.commands = new Collection();
  }

  client.commands.set("link", linkFunc);
  client.commands.set("unlink", unlinkFunc);
  client.commands.set("sheet", sheetFunc);
  client.commands.set("status", statusFunc);
  client.commands.set("sync", syncFunc);

  client.commands.set("armorytext", armoryGroupFunc);
  client.commands.set("clan", clanGroupFunc);
}

module.exports = {
  initializeCommands,
}