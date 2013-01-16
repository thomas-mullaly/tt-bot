(function () {
    "use strict";

    var CommandsModule = function (ttApi, utils) {
        this.ttApi = ttApi;
        this.commandHandlers = [];

        ttApi.on("speak", utils.proxy(this, this.onChatMessageRecieved));
        ttApi.on("pmmed", utils.proxy(this, this.onPrivateMessageRecieved));
    };

    CommandsModule.prototype.onChatMessageRecieved = function (data) {
        console.log(data);
        //this.ttApi.speak("Got message");
    };

    CommandsModule.prototype.onPrivateMessageRecieved = function (data) {
        console.log(data);
    };

    CommandsModule.prototype.registerCommandHandler = function (commandHandlerInfo, callback) {
        this.commandHandlers.push({ commandInfo: commandHandlerInfo, callback: callback });
    };

    module.exports = CommandsModule;
})();