(function () {
    "use strict";

    var fs = require("fs");
    var _ = require("underscore");

    var User = require("./../model/User.js");

    var CommandsModule = function (ttApi, roomManagementModule, config) {
        this.ttApi = ttApi;
        this.commandHandlers = [];
        this.commandsDirectory = __dirname + "/./../commands";
        this.botConfig = config;
        this._roomManagementModule = roomManagementModule;

        this._loadCommandHandlers();

        ttApi.on("speak", _.bind(this.onChatMessageRecieved, this));
        ttApi.on("pmmed", _.bind(this.onPrivateMessageRecieved, this));
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
        var user = null;

        if (messageData.command === 'speak') {
            user = this._roomManagementModule.currentUsers()[userId];
        } else {
            user = new User(userId, messageData.name, null);
            user.setModerator(this._roomManagementModule.isModerator(userId));
        }

        return {
            type: messageData.command,
            user: user,
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

            var command = '';

            // Only append the bot name if it's a bot specific command and the message
            // came from the the chat.
            if (commandHandler.info.botSpecific) {
                command += '/'
                if (data.command === 'speak') {
                    command += this.botConfig.bot.name + ' ';
                }
            }

            command += commandHandler.info.command;

            if (data.text.toLowerCase().indexOf(command.toLowerCase()) === 0) {
                if (data.text.length === command.length || data.text[command.length] === ' ') {
                    var parameters = data.text.substring(command.length);
                    commandHandler.callback(this._createCommandData(data, parameters), this.ttApi);
                }
            }
        }
    };

    CommandsModule.prototype.registerCommandHandler = function (commandHandlerInfo, callback) {
        this.commandHandlers.push({ info: commandHandlerInfo, callback: callback });
    };

    CommandsModule.prototype.roomManagementModule = function () {
        return this._roomManagementModule;
    };

    module.exports = CommandsModule;
})();