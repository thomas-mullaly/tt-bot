(function () {
    var sciencePhrases = [];

    var science = function (data, ttApi) {
        var response = Math.floor(Math.random() * sciencePhrases.length);

        ttApi.speak(sciencePhrases[response]);
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        if (botConfig.science_phrases) {
            sciencePhrases = botConfig.science_phrases;
            commandsModule.registerCommandHandler({ botSpecific: true, command: "do a science" }, science);
        }
    };
})();