(function () {
    var fs = require("fs");
    var Bot = require("ttapi");
    var config = JSON.parse(fs.readFileSync('config.json', 'ascii'));

    var bot = new Bot(config.bot.credentials.auth, config.bot.credentials.userid, config.bot.roomid);

    bot.on('speak', function (data) {
        // Respond to "/hello" command
        if (data.text.match(/^\/hello$/)) {
        bot.speak('Hey! How are you @'+data.name+' ?');
        }
    });
}).call(this);