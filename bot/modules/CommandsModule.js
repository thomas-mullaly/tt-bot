(function () {
    "use strict";

    var fs = require("fs");

    var CommandsModule = function (ttApi, utils, config) {
        this.ttApi = ttApi;
        this.commandHandlers = [];
        this.botCommandPrefix = '/' + config.bot.name;
        this.commandsDirectory = __dirname + "/./../commands";
        this.utils = utils;
        this.botConfig = config;

        this._loadCommandHandlers();

        ttApi.on("speak", utils.proxy(this, this.onChatMessageRecieved));
        ttApi.on("pmmed", utils.proxy(this, this.onPrivateMessageRecieved));
    };

    CommandsModule.prototype.onChatMessageRecieved = function (data) {
        // Don't listen to messages from ourself.
        if (data.userid !== this.botConfig.bot.credentials.userid) {
            this._processMessage(data);
        }
    };

    CommandsModule.prototype.onPrivateMessageRecieved = function (data) {
        this._processMessage(data);
    };

    CommandsModule.prototype._createCommandData = function (messageData, parameters) {
        var userId = messageData.senderid ? messageData.senderid : messageData.userid;
        return {
            type: messageData.command,
            userId: userId,
            roomId: messageData.roomid,
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
                    commandHandler.attachCommandHandler(self, self.ttApi, self.botConfig);
                }
            }
        });
    };

    CommandsModule.prototype._processMessage = function (data) {
        for (var i = 0; i < this.commandHandlers.length; ++i) {
            var commandHandler = this.commandHandlers[i];

            var command = '/';

            // Only append the bot name if it's a bot specific command and the message
            // came from the the chat.
            if (commandHandler.info.botSpecific && data.command === 'speak') {
                command += this.botConfig.bot.name + ' ';
            }

            command += commandHandler.info.command;

            if (data.text.toLowerCase().indexOf(command.toLowerCase()) === 0) {
                var parameters = data.text.substring(command.length);
                commandHandler.callback(this._createCommandData(data, parameters), this.ttApi);
            }
        }
    };

    CommandsModule.prototype.registerCommandHandler = function (commandHandlerInfo, callback) {
        this.commandHandlers.push({ info: commandHandlerInfo, callback: callback });
    };

    module.exports = CommandsModule;
})();