(function () {

    var QueueCommandHandler = function () {
        this.isQueueOn = false;
        this.playCount = 1;
        this.currentDjs = [];
        this.djQueue = [];
    };

    QueueCommandHandler.prototype.queueOn = function (data, ttApi) {
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {

    };

})();