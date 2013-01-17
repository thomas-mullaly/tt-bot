(function () {
    "use strict";

    var ParrotCommandHandler = function (ttApi) {
        this.ttApi = ttApi;
    };

    ParrotCommandHandler.prototype.parrot = function (data) {
        this.ttApi.speak(data.parameters.trim());
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, utils) {
        var parrotCommandHandler = new ParrotCommandHandler(ttApi);

        commandsModule.registerCommandHandler({ botSpecific: true, command: "parrot" },
            utils.proxy(parrotCommandHandler, parrotCommandHandler.parrot));
    };

})();