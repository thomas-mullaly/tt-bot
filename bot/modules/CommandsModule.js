(function () {
    "use strict";

    var CommandsModule = function (ttApi, utils) {
        this.ttApi = ttApi;

        ttApi.on("speak", utils.proxy(this, this.onChatMessageRecieved));
    };

    CommandsModule.prototype.onChatMessageRecieved = function (data) {
        this.ttApi.speak("Got message");
    };

    module.exports = CommandsModule;
})();