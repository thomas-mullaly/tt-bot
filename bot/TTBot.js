(function () {
    "use strict";

    var TTApi = require("ttapi");
    var util = require("./Utils.js");
    var StatsModule = require("./modules/StatsModule.js");
    var CommandsModule = require("./modules/CommandsModule.js");

    var TTBot = function (projectDir) {
        this.config = null;
        this.ttApi = null;
        this.PROJECT_DIR = projectDir;
        this.statsModule = null;
        this.commandsModule = null;
    };

    TTBot.prototype.initialize = function () {
        var fs = require("fs");
        this.config = JSON.parse(fs.readFileSync(this.PROJECT_DIR + '/config.json', 'ascii'));
    };

    TTBot.prototype.run = function () {
        var botConfig = this.config.bot;
        this.ttApi = new TTApi(botConfig.credentials.auth, botConfig.credentials.userid, botConfig.roomid);

        this._loadModules();
    };

    TTBot.prototype._loadEventHandlers = function () {

    };

    TTBot.prototype._loadModules = function () {
        this.statsModule = new StatsModule(this.ttApi, util);
        this.commandsModule = new CommandsModule(this.ttApi, util);
    };

    TTBot.prototype.getTTApi = function () {
        return this.ttApi;
    };

    module.exports = TTBot;
}).call(this);