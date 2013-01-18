(function () {
    "use strict";

    var parrot = function (data, ttApi) {
        ttApi.speak(data.parameters.trim());
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        commandsModule.registerCommandHandler({ botSpecific: true, command: "parrot" }, parrot);
    };

})();