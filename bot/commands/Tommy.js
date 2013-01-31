(function () {
    var tommyPhrases = [];

    var tommy = function (data, ttApi) {
        var response = Math.floor(Math.random() * tommyPhrases.length);

        ttApi.speak(tommyPhrases[response]);
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        if (botConfig.tommy_phrases) {
            tommyPhrases = botConfig.tommy_phrases;
            commandsModule.registerCommandHandler({ botSpecific: true, command: "tommy" }, tommy);
        }
    };
})();