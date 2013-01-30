(function () {

    var _ = require("underscore");

    var QueueCommandHandler = function (roomManagementModule, ttApi) {
        this._roomManagementModule = roomManagementModule;
        this._ttApi = ttApi;
        this._isQueueOn = false;
        this._queue = [];
        this._registeredToRoomEvents = false;
        this._lastDj = null;
        this._validStepUpQueue = {};
    };

    QueueCommandHandler.prototype._registerToRoomEvents = function () {
        if (this._registeredToRoomEvents) {
            return;
        }

        console.log("Registering...");

        this._roomManagementModule.on("songEnded", _.bind(this._onSongEnded, this));
        this._roomManagementModule.on("songStarted", _.bind(this._onSongStarted, this));
        this._roomManagementModule.on("djRemoved", _.bind(this._onDjRemoved, this));
        this._roomManagementModule.on("djAdded", _.bind(this._onDjAdded, this));
        this._registeredToRoomEvents = true;
    };

    QueueCommandHandler.prototype._onDjAdded = function (data) {
        var i;

        if (!this._isQueueOn) {
            return;
        }

        // Check if it was a valid step up.
        if (!this._validStepUpQueue[data.userId]) {
            this._ttApi.remDj(data.userId);
        } else {
            console.log(["Clearing timeout", this._validStepUpQueue[data.userId].timeoutId]);
            clearTimeout(this._validStepUpQueue[data.userId].timeoutId);
            delete this._validStepUpQueue[data.userId];
        }
    };

    QueueCommandHandler.prototype._onDjRemoved = function (data) {
        var self = this;
        var position = -1;

        if (!self._isQueueOn) {
            return;
        }

        // If the last DJ steps down, the next person to step up is the first person in the queue.
        if (self._lastDj && self._lastDj.userId === data.userId) {
            // Add the user that just DJ'd back into the queue.
            position = self.addUserToQueue(data);
            self._ttApi.pm("Thanks for DJing! You've been added to the queue, your current position is " + (position + 1), data.userId);
            self._lastDj = null;
        }

        self._allowNextPersonInQueueToStepUp();
    };

    QueueCommandHandler.prototype._allowNextPersonInQueueToStepUp = function () {
        var self = this;
        var chatResponse = null;

        console.log(self._queue);
        if (self._queue.length > 0) {
            dj = self._queue.splice(0, 1);

            timeoutId = setTimeout(function () {
                self._queueStepUpMissed.apply(self, [dj]);
            }, 30000);
            console.log(["timeoutId", timeoutId]);

            self._validStepUpQueue[dj.userId] = { userInfo: dj, timeoutId: timeoutId };
            chatResponse = "@" + dj.userName + " it's your turn to spin!";
            self._ttApi.pm("This is your spot! You have 30 seconds to hop up before I give it away.", dj.userId);
        }

        // Notify the next person in line that their turn is coming up. (if there is someone).
        if (self._queue.length > 0) {
            chatResponse += " @" + self._queue[0].userName + " you're up next, so get ready!";
        }

        if (chatResponse) {
            self._ttApi.speak(chatResponse);
        }
    };

    // Fires when a user that was in the queue doesn't stepup in their alotted time period.
    QueueCommandHandler.prototype._queueStepUpMissed = function (dj) {
        var i;

        // Remove them from the valid step up queue.
        if (this._validStepUpQueue[dj.userId]) {
            delete this._validStepUpQueue[dj.userId];
        }

        // Allow the next person inline to stepup.
        this._allowNextPersonInQueueToStepUp();
    };

    QueueCommandHandler.prototype._onSongEnded = function (data) {
        var self = this;
        var djToRemoveId = data.room.metadata.current_dj;

        if (!this._isQueueOn) {
            return;
        }

        this._lastDj = this._roomManagementModule.currentListeners()[djToRemoveId];
    };

    QueueCommandHandler.prototype._onSongStarted = function (data) {
        if (!this._isQueueOn) {
            return;
        }

        // Remove the last dj (if there is one) at the beginning of the song.
        if (this._lastDj) {
            this._ttApi.remDj(this._lastDj.userId);
        }
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
            this._registerToRoomEvents();
            this._isQueueOn = true;
            ttApi.speak("The queue has been turned on. Everybody queue up!");
        }
    };

    QueueCommandHandler.prototype.queueOff = function (data, ttApi) {
        if (this._roomManagementModule.isAdmin(data.userId)) {
            this._isQueueOn = false;
            this._queue = [];
            this._validStepUpQueue = {};
            this._lastDj = null;
            ttApi.speak("The queue has been turned off.");
        }
    };

    QueueCommandHandler.prototype.addToQueue = function (data, ttApi) {
        var position = -1;

        if (!this._isQueueOn) {
            ttApi.speak("The queue isn't currently enabled @" + data.userName + ". Feel free to hop up when there's an opening!");
            return;
        }

        position = this.addUserToQueue(data);

        ttApi.speak("@" + data.userName + ", you've been added to queue. Your current position is " + (position + 1));
    };

    QueueCommandHandler.prototype.addUserToQueue = function (userInfo) {
        var i, position = -1;

        // Check if the user is in the queue.
        for (i = 0; i < this._queue.length; ++i) {
            if (this._queue[i].userId === userInfo.userId) {
                position = i;
                break;
            }
        }

        // Add the user if they're not in the queue.
        if (position === -1) {
            this._queue.push({ userId: userInfo.userId, userName: userInfo.userName });
            position = this._queue.length-1;
        }

        return position;
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
        var queueCommandHandler = new QueueCommandHandler(commandsModule.roomManagementModule(), ttApi);

        commandsModule.registerCommandHandler({ botSpecific: true, command: "q" }, _.bind(queueCommandHandler.queueCommand, queueCommandHandler));
        commandsModule.registerCommandHandler({ botSpecific: true, command: "list"}, _.bind(queueCommandHandler.listQueue, queueCommandHandler));
        commandsModule.registerCommandHandler({ botSpecific: true, command: "dq"}, _.bind(queueCommandHandler.dequeue, queueCommandHandler));
    };

})();