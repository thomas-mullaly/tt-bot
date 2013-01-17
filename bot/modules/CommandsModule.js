(function () {
    "use strict";

    var fs = require("fs");

    var CommandsModule = function (ttApi, utils, config) {
        this.ttApi = ttApi;
        this.commandHandlers = [];
        this.botCommandPrefix = '/' + config.bot.name;
        this.commandsDirectory = __dirname + "/./../commands";
        this.utils = utils;

        this._loadCommandHandlers();

        ttApi.on("speak", utils.proxy(this, this.onChatMessageRecieved));
        ttApi.on("pmmed", utils.proxy(this, this.onPrivateMessageRecieved));
    };

    CommandsModule.prototype.onChatMessageRecieved = function (data) {
        console.log(data);
        this._processMessage(data);
    };

    CommandsModule.prototype.onPrivateMessageRecieved = function (data) {
        console.log(data);
    };

    CommandsModule.prototype._createCommandData = function (messageData, parameters) {
        return {
            userId: messageData.userid,
            roomId: messageData.roomid,
            userName: messageData.user,
            message: messageData.text,
            parameters: parameters
        };
    };

    CommandsModule.prototype._loadCommandHandlers = function () {
        var self = this;

        fs.readdir(self.commandsDirectory, function (err, files) {
            for (var i = 0; i < files.length; ++i) {
                if ((/\.js$/).test(files[i])) {
                    var commandHandler = require(self.commandsDirectory + '/' + files[i]);
                    commandHandler.attachCommandHandler(self, self.ttApi, self.utils);
                }
            }
        });
    };

    CommandsModule.prototype._processMessage = function (data) {
        for (var i = 0; i < this.commandHandlers.length; ++i) {
            var commandHandler = this.commandHandlers[i];
            if (commandHandler.info.botSpecific) {
                var command = this.botCommandPrefix + ' ' + commandHandler.info.command;
                if (data.text.toLowerCase().indexOf(command.toLowerCase()) === 0) {
                    var parameters = data.text.substring(command.length);
                    commandHandler.callback(this._createCommandData(data, parameters));
                }
            }
        }
    };

    CommandsModule.prototype.registerCommandHandler = function (commandHandlerInfo, callback) {
        this.commandHandlers.push({ info: commandHandlerInfo, callback: callback });
    };

    module.exports = CommandsModule;
})();