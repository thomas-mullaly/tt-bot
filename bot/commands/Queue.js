(function () {

    var _ = require("underscore");

    var QueueCommandHandler = function (roomManagementModule) {
        this._roomManagementModule = roomManagementModule;
        this._isQueueOn = false;
        this._queue = [];
    };

    QueueCommandHandler.prototype.queueCommand = function (data, ttApi) {
        if (data.parameters.trim().length === 0) {
            this.addToQueue(data, ttApi);
        } else if (data.parameters.trim().toLowerCase() === 'on') {
            this.queueOn(data, ttApi);
        } else if (data.parameters.trim().toLowerCase() === 'off') {
            this.queueOff(data, ttApi);
        } else {
            if (data.userId === '509d34f2aaa5cd4b5baab6c2') {
                ttApi.speak("What? Use your words @" + data.userName + "! Use your words.");
            } else {
                ttApi.speak("You're speaking gibberish, kid.");
            }
        }
    };

    QueueCommandHandler.prototype.queueOn = function (data, ttApi) {
        if (this._roomManagementModule.isAdmin(data.userId)) {
            this._isQueueOn = true;
            ttApi.speak("The queue has been turned on. Everybody queue up!");
        }
    };

    QueueCommandHandler.prototype.queueOff = function (data, ttApi) {
        if (this._roomManagementModule.isAdmin(data.userId)) {
            this._isQueueOn = false;
            this._queue = [];
            ttApi.speak("The queue has been turned off.");
        }
    };

    QueueCommandHandler.prototype.addToQueue = function (data, ttApi) {
        var i, position = -1;

        if (!this._isQueueOn) {
            ttApi.speak("The queue isn't currently enabled @" + data.userName + ". Feel free to hop up when there's an opening!");
            return;
        }

        // Check if the user is in the queue.
        for (i = 0; i < this._queue.length; ++i) {
            if (this._queue[i].userId === data.userId) {
                position = i;
                break;
            }
        }

        // Add the user if they're not in the queue.
        if (position === -1) {
            this._queue.push({ userId: data.userId, userName: data.userName });
            position = this._queue.length-1;
        }

        ttApi.speak("@" + data.userName + ", you've been added to queue. Your current position is " + (position + 1));
    };

    QueueCommandHandler.prototype.listQueue = function (data, ttApi) {
        var usersInQueue = null;

        if (this._isQueueOn) {
            usersInQueue = _(this._queue).pluck('userName');
            if (usersInQueue.length === 0) {
                ttApi.speak("No one is currently in the queue.");
            } else {
                ttApi.speak(usersInQueue.join(", "));
            }
        }
    };

    QueueCommandHandler.prototype.dequeue = function (data, ttApi) {
        var usersInQueue, position;

        if (!this._isQueueOn) {
            ttApi.speak("The queue's not enabled. You're drunk @" + data.userName + ". Go home.");
        }

        usersInQueue = _(this._queue).pluck('userId');
        position = _(usersInQueue).indexOf(data.userId);

        if (position > -1) {
            this._queue.splice(position, 1);
            ttApi.speak("@" + data.userName + ", you've been dequeued.");
        }
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        var queueCommandHandler = new QueueCommandHandler(commandsModule.roomManagementModule());

        commandsModule.registerCommandHandler({ botSpecific: true, command: "q" }, _.bind(queueCommandHandler.queueCommand, queueCommandHandler));
        commandsModule.registerCommandHandler({ botSpecific: true, command: "list"}, _.bind(queueCommandHandler.listQueue, queueCommandHandler));
        commandsModule.registerCommandHandler({ botSpecific: true, command: "dq"}, _.bind(queueCommandHandler.dequeue, queueCommandHandler));
    };

})();