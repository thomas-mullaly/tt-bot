(function () {
    var backToTheFuturePhrases = [];

    var backToTheFuture = function (data, ttApi) {
        var response = Math.floor(Math.random() * backToTheFuturePhrases.length);

        if (data.user.userId() === "509d34f2aaa5cd4b5baab6c2") {
            ttApi.speak("Not until you watch the movies @" + data.user.userName() + "!");
            return;
        }

        ttApi.speak(backToTheFuturePhrases[response]);
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        if (botConfig.back_to_the_future_phrases) {
            backToTheFuturePhrases = botConfig.back_to_the_future_phrases;
            commandsModule.registerCommandHandler({ botSpecific: true, command: "88mph" }, backToTheFuture);
        }
    };
})();