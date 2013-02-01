(function () {

    var _ = require("underscore");

    var QueueCommandHandler = function (roomManagementModule, ttApi) {
        this._roomManagementModule = roomManagementModule;
        this._ttApi = ttApi;
        this._isQueueOn = false;
        this._queue = [];
        this._registeredToRoomEvents = false;
        this._lastDj = null;
        this._stepUpQueue = [];
        this._currentDjCount = 0;
        this._wasValidStepUp = false;
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

        for (i = 0; i < this._stepUpQueue.length; ++i) {
            if (this._stepUpQueue[i].userId === data.userId()) {
                this._stepUpQueue[i].isDJing = true;
                if (this._stepUpQueue[i].timeoutId) {
                    clearTimeout(this._stepUpQueue[i].timeoutId);
                    this._stepUpQueue[i].timeoutId = null;
                }
                return;
            }
        }

        // If we get here, it wasn't a valid step up. So pull them.
        this._ttApi.remDj(data.userId());
        this._ttApi.speak("We're using a queue @" + data.userName() + ". Type '/bert2 q' for a chance to spin.");
    };

    QueueCommandHandler.prototype._onDjRemoved = function (data) {
        var self = this;
        var position = -1;
        var i;

        if (!self._isQueueOn) {
            return;
        }

        // If the last DJ steps down, the next person to step up is the first person in the queue.
        if (self._lastDj && self._lastDj.userId() === data.userId()) {
            // Add the user that just DJ'd back into the queue.
            position = self.addUserToQueue(data);
            self._ttApi.pm("Thanks for DJing! You've been added to the queue, your current position is " + (position + 1), data.userId());
            self._lastDj = null;

            self._allowNextPersonInQueueToStepUp();
        } else {
            // Check if it was an early step down.
            for (i = 0; i < self._stepUpQueue.length; ++i) {
                if (self._stepUpQueue[i].userId === data.userId()) {
                    self._stepUpQueue[i].isDJing = false;
                    self._handleEarlyStepDown(self._stepUpQueue[i]);
                }
            }
        }
    };

    QueueCommandHandler.prototype._handleEarlyStepDown = function (dj) {
        var self = this;
        var pmMessage = "Are you sure you want to step down? I'll hold your spot for 30 seconds before I give it away.";
        var chatMessage = "@" + dj.userName + " are you sure you want to step down? I'll hold your spot for 30 seconds before I give it away."

        self._ttApi.pm(pmMessage, dj.userId);
        self._ttApi.speak(chatMessage);

        dj.timeoutId = setTimeout(function () {
            var i;
            // Make sure the user is in the stepUpQueue before allowing a new person to stepup.
            for (i = 0; i < self._stepUpQueue.length; ++i) {
                if (self._stepUpQueue[i].userId === dj.userId && !self._stepUpQueue.isDJing) {
                    // They missed their chance. Move on to the next person.
                    self._stepUpQueue.splice(i, 1);
                    self._allowNextPersonInQueueToStepUp.apply(self);
                }
            }
        }, 30000);
    };

    QueueCommandHandler.prototype._allowNextPersonInQueueToStepUp = function () {
        var self = this;
        var chatResponse = null;
        var dj;
        var timeoutId;

        if (self._queue.length > 0) {
            dj = self._queue.splice(0, 1)[0];

            var timeoutId = setTimeout(function (dj) {
                var i;

                for (i = 0; i < self._stepUpQueue.length; ++i) {
                    if (self._stepUpQueue[i].userId === dj.userId && !self._stepUpQueue[i].isDJing) {
                        self._queueStepUpMissed.apply(self, [dj]);
                        return;
                    }
                }
            }, 30000, dj);

            self._stepUpQueue.push({ userId: dj.userId, userName: dj.userName, isDJing: false, timeoutId: timeoutId });

            chatResponse = "@" + dj.userName + " it's your turn to spin!";
            self._ttApi.pm("This is your spot! You have 30 seconds to hop up before I give it away.", dj.userId);

            // Notify the next person in line that their turn is coming up. (if there is someone).
            if (self._queue.length > 0) {
                chatResponse += " @" + self._queue[0].userName + " you're up next, so get ready!";
            }

            if (chatResponse) {
                self._ttApi.speak(chatResponse);
            }
        }
    };

    // Fires when a user that was in the queue doesn't stepup in their alotted time period.
    QueueCommandHandler.prototype._queueStepUpMissed = function (dj) {
        var i;

        // Remove the DJ from the step up queue and tell them they're being dequeued.
        for (i = 0; i < this._stepUpQueue.length; ++i) {
            if (this._stepUpQueue[i].userId === dj.userId) {
                this._stepUpQueue.splice(i, 1);

                this._ttApi.speak("@" + dj.userName + " you're being dequeued until you're not AFK anymore.");
                break;
            }
        }

        // Allow the next person inline to stepup.
        this._allowNextPersonInQueueToStepUp();
    };

    QueueCommandHandler.prototype._onSongEnded = function (data) {
        var djToRemoveId = data.room.metadata.current_dj;
        var i;

        if (!this._isQueueOn) {
            return;
        }

        this._lastDj = this._roomManagementModule.currentListeners()[djToRemoveId];

        this._ttApi.remDj(djToRemoveId);
    };

    QueueCommandHandler.prototype._onSongStarted = function (data) {
        var i;

        if (!this._isQueueOn) {
            return;
        }

        // Remove the current DJ from the step up queue.
        for (i = 0; i < this._stepUpQueue.length; ++i) {
            if (this._stepUpQueue[i].userId === this._roomManagementModule.currentDj().userId()) {
                this._stepUpQueue.splice(i, 1);
            }
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
        var self = this;
        if (this._roomManagementModule.isAdmin(data.userId)) {
            this._registerToRoomEvents();
            this._isQueueOn = true;
            ttApi.speak("The queue has been turned on. Everybody queue up!");

            // Add the current DJs on stage to the stepUp queue.
            var currentDjs = this._roomManagementModule.currentDjs();

            currentDjs.forEach(function (djId){
                var dj = self._roomManagementModule.currentListeners()[djId];
                if (self._roomManagementModule.currentDj().userId() !== djId) {
                    self._stepUpQueue.push({ userId: dj.userId(), userName: dj.userName(), isDJing: true, timeoutId: null });
                }
            });
        }
    };

    QueueCommandHandler.prototype.queueOff = function (data, ttApi) {
        if (this._roomManagementModule.isAdmin(data.userId)) {
            this._isQueueOn = false;
            this._queue = [];
            this._stepUpQueue = [];
            this._lastDj = null;
            ttApi.speak("The queue has been turned off.");
        }
    };

    QueueCommandHandler.prototype.addToQueue = function (data, ttApi) {
        var position = -1;
        var positionsFilled = -1;

        if (!this._isQueueOn) {
            ttApi.speak("The queue isn't currently enabled @" + data.userName + ". Feel free to hop up when there's an opening!");
            return;
        } else if (this._roomManagementModule.currentDjs().indexOf(data.userId) > -1) {
            ttApi.speak("What? Now you want to take two DJ spots on stage @" + data.userName + "?");
            return;
        }

        position = this.addUserToQueue(data);

        // Allow them to step up if there's room.
        positionsFilled = this._stepUpQueue.length;
        if (this._roomManagementModule.currentDj()) {
            positionsFilled += 1;
        }
        if (positionsFilled < 5) {
            this._allowNextPersonInQueueToStepUp();
        } else {
            ttApi.speak("@" + data.userName + ", you've been added to queue. Your current position is " + (position + 1));
        }
    };

    QueueCommandHandler.prototype.addUserToQueue = function (userInfo) {
        var i, position = -1;

        // Check if the user is in the queue.
        for (i = 0; i < this._queue.length; ++i) {
            if (this._queue[i].userId === userInfo.userId()) {
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
        var usersInStepUpQueue = null;
        var timeoutLength = 1;

        if (this._isQueueOn) {
            usersInQueue = _(this._queue).pluck('userName');
            usersInStepUpQueue = _.chain(this._stepUpQueue).where({ isDJing: false }).pluck('userName');
            if (usersInQueue.length === 0 && usersInStepUpQueue.length === 0) {
                ttApi.speak("No one is currently in the queue.");
            } else {
                if (usersInStepUpQueue.length > 0) {
                    ttApi.speak("Waiting on: " + usersInStepUpQueue.join(", "));
                    timeoutLength = 250;
                }

                if (usersInQueue.length > 0) {
                    setTimeout(function () {
                        ttApi.speak("In queue: " + usersInQueue.join(", "));
                    }, timeoutLength);
                }
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