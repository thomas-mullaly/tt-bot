(function () {
    "use strict";

    var TTApi = require("ttapi");
    var EventEmitter = require("events").EventEmitter;

    var TTBot = function (projectDir) {
        this.config = null;
        this.ttApi = null;
        this.PROJECT_DIR = projectDir;
    };

    TTBot.prototype.__proto__ = EventEmitter.prototype;

    TTBot.prototype.initialize = function () {
        var fs = require("fs");
        this.config = JSON.parse(fs.readFileSync(this.PROJECT_DIR + '/config.json', 'ascii'));
    };

    TTBot.prototype.run = function () {
        var botConfig = this.config.bot;
        this.ttApi = new TTApi(botConfig.credentials.auth, botConfig.credentials.userid, botConfig.roomid)
    };

    TTBot.prototype.getTTApi = function () {
        return this.ttApi;
    };

    module.exports = TTBot;
}).call(this);