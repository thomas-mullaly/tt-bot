(function () {
    "use strict";

    var CommandsModule = function (ttApi, utils) {
        this.ttApi = ttApi;

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

    module.exports = CommandsModule;
})();