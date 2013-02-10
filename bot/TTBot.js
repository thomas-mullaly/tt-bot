(function () {
    "use strict";

    var TTApi = require("ttapi");
    var StatsModule = require("./modules/StatsModule.js");
    var CommandsModule = require("./modules/CommandsModule.js");
    var RoomManagementModule = require("./modules/RoomManagementModule.js");

    var underscore = require("underscore");

    var TTBot = function (projectDir) {
        this.config = null;
        this.ttApi = null;
        this.PROJECT_DIR = projectDir;
        this.statsModule = null;
        this.commandsModule = null;
        this.roomManagementModule = null;
    };

    TTBot.prototype.initialize = function () {
        var fs = require("fs");
        this.config = JSON.parse(fs.readFileSync(this.PROJECT_DIR + '/config.json', 'ascii'));
        var botConfig = JSON.parse(fs.readFileSync(this.PROJECT_DIR + '/bot.json', 'ascii'));

        underscore.extend(this.config, botConfig);
    };

    TTBot.prototype.run = function () {
        var self = this;
        var botConfig = this.config.bot;
        this.ttApi = new TTApi(botConfig.credentials.auth, botConfig.credentials.userid, botConfig.roomid);

        this.ttApi.on("ready", function () {
            console.log(arguments);
            self._loadModules();
        });
    };

    TTBot.prototype._loadModules = function () {
        this.statsModule = new StatsModule(this.ttApi);
        this.roomManagementModule = new RoomManagementModule(this.ttApi, this.config);
        this.commandsModule = new CommandsModule(this.ttApi, this.roomManagementModule, this.config);
    };

    TTBot.prototype.getTTApi = function () {
        return this.ttApi;
    };

    module.exports = TTBot;
}).call(this);