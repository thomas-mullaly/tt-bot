(function () {
    "use strict";

    var DanceCommandHandler = function (ttApi) {
        this.ttApi = ttApi;
    };

    DanceCommandHandler.prototype.bop = function () {
        this.ttApi.bop();
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, utils) {
        var danceCommandHandler = new DanceCommandHandler(ttApi);

        commandsModule.registerCommandHandler({ botSpecific: true, command: "bop" },
            utils.proxy(danceCommandHandler, danceCommandHandler.bop));
        commandsModule.registerCommandHandler({ botSpecific: true, command: "dance" },
            utils.proxy(danceCommandHandler, danceCommandHandler.bop));
    }
})();