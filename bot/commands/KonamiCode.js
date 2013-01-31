(function () {
    var KONAMI_CODE = ":arrow_up: :arrow_up: :arrow_down: :arrow_down: :arrow_left: :arrow_right: :arrow_left: :arrow_right: :b: :a:";
    var roomManagementModule = null;

    var konamiCode = function (data, ttApi) {
        var currentDj = roomManagementModule.currentDj();
        if (currentDj && data.parameters === "") {
            ttApi.speak(":godmode: activated! Free point awarded to @" + currentDj.userName + "!");
            ttApi.bop();
        }
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        roomManagementModule = commandsModule.roomManagementModule();
        commandsModule.registerCommandHandler({ botSpecific: true, command: KONAMI_CODE }, konamiCode);
    };
})();