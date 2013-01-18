(function () {
    var botAdminId = null;

    var shutdown = function (data, ttApi) {
        if (data.userId === botAdminId) {
            ttApi.speak("Shutting down...");
            ttApi.roomDeregister();
            process.exit(0);
        }
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        botAdminId = botConfig.bot.admin;
        commandsModule.registerCommandHandler({ botSpecific: true, command: "shutdown" }, shutdown);
    };
})();