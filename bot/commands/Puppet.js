(function () {
    "use strict";

    var puppet = function (data, ttApi) {
        ttApi.speak(data.parameters.trim());
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        commandsModule.registerCommandHandler({ botSpecific: true, command: "puppet" }, puppet);
        commandsModule.registerCommandHandler({ botSpecific: true, command: "p"}, puppet);
    };

})();