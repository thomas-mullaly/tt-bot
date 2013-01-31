(function () {
    var duchessPhrases = [];

    var duchess = function (data, ttApi) {
        var response = Math.floor(Math.random() * duchessPhrases.length);

        ttApi.speak(duchessPhrases[response]);
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        if (botConfig.duchess_phrases) {
            duchessPhrases = botConfig.duchess_phrases;
            commandsModule.registerCommandHandler({ botSpecific: true, command: "duchess" }, duchess);
        }
    };
})();