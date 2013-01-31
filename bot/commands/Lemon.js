(function () {
    var lemonPhrases = [];

    var lemon = function (data, ttApi) {
        var response = Math.floor(Math.random() * lemonPhrases.length);

        ttApi.speak(lemonPhrases[response]);
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        if (botConfig.lemon_phrases) {
            lemonPhrases = botConfig.lemon_phrases;
            commandsModule.registerCommandHandler({ botSpecific: true, command: "lemon" }, lemon);
            commandsModule.registerCommandHandler({ botSpecific: true, command: ":lemon:" }, lemon);
        }
    };
})();