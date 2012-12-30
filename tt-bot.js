(function () {
    var TTBot = require("./bot/TTBot.js");

    var bot = new TTBot(__dirname);
    bot.initialize();
    bot.run();
}).call(this);