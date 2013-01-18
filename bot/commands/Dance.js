(function () {
    "use strict";

    var bop = function (data, ttApi, msg) {
        ttApi.bop();
        if (msg !== null) {
            ttApi.speak(msg);
        }
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        if (botConfig.dance_aliases && botConfig.dance_alises !== null) {
            var danceAliases = botConfig.dance_aliases;
            danceAliases.forEach(function (value) {
                commandsModule.registerCommandHandler({ botSpecific: true, command: value.name},
                    function (data, ttApi) {
                        bop(data, ttApi, value.response);
                    });
            });
        } else {
            // Just register some default commands.
            commandsModule.registerCommandHandler({ botSpecific: true, command: "bop" },
                utils.proxy(danceCommandHandler, bop));
            commandsModule.registerCommandHandler({ botSpecific: true, command: "dance" },
                utils.proxy(danceCommandHandler, bop));
        }
    }
})();