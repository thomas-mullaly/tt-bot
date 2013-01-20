(function () {
    "use strict";

    var bop = function (data, ttApi, responseInfo) {
        ttApi.bop();

        if (responseInfo.responseType === 'single' && responseInfo.responseData !== null) {
            ttApi.speak(responseInfo.responseData);
        } else if (responseInfo.responseType === 'random' && typeof responseInfo.responseData === 'object') {
            var responseIndex = Math.floor(Math.random() * responseInfo.responseData.length);
            ttApi.speak(responseInfo.responseData[responseIndex]);
        }
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        if (botConfig.dance_aliases && botConfig.dance_alises !== null) {
            var danceAliases = botConfig.dance_aliases;
            danceAliases.forEach(function (value) {
                commandsModule.registerCommandHandler({ botSpecific: true, command: value.name},
                    function (data, ttApi) {
                        bop(data, ttApi, value);
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