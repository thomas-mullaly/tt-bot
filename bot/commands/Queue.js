(function () {
    "use strict";

    var _ = require("underscore");

    var QueueCommandHandler = function (roomManagementModule, ttApi, queueConfig) {
        this._roomManagementModule = roomManagementModule;
        this._ttApi = ttApi;
        this._isQueueOn = false;
        this._queue = [];
        this._lastDj = null;
        this._stepUpQueue = [];
        this._currentDjCount = 0;
        this._wasValidStepUp = false;

        this._queueConfig = queueConfig;

        this._stepUpChatTemplate = null;
        this._dequeueTemplate = null;
        this._setUpPMTemplate = null;
        this._onDeckTemplate = null;
        this._bootTemplate = null;
        this._escortTemplate = null;
        this._stepDownChatTemplate = null;
        this._stepDownPMTemplate = null;
        this._init();
    };

    QueueCommandHandler.prototype = {
        _init: function () {
            this._registerToRoomEvents();
            this._setupTemplates();
        },

        _setupTemplates: function () {
            this._stepUpChatTemplate = _.template(this._queueConfig.stepUpMessages.chatMessage);
            this._onDeckTemplate = _.template(this._queueConfig.stepUpMessages.onDeckMessage);
            this._setUpPMTemplate = _.template(this._queueConfig.stepUpMessages.pmMessage);
            this._dequeueTemplate = _.template(this._queueConfig.dequeueMessage);
            this._bootTemplate = _.template(this._queueConfig.escortOptions.bootMessage);
            this._escortTemplate = _.template(this._queueConfig.escortOptions.escortMessage);
            this._stepDownChatTemplate = _.template(this._queueConfig.stepDownMessages.chatMessage);
            this._stepDownPMTemplate = _.template(this._queueConfig.stepDownMessages.pmMessage);
        },

        _registerToRoomEvents: function () {
            console.log("Registering...");

            this._roomManagementModule.on("enteredRoom", _.bind(this._onEnteredRoom, this));
            this._roomManagementModule.on("userJoined", _.bind(this._onUserJoined, this));
            this._roomManagementModule.on("songEnded", _.bind(this._onSongEnded, this));
            this._roomManagementModule.on("songStarted", _.bind(this._onSongStarted, this));
            this._roomManagementModule.on("djRemoved", _.bind(this._onDjRemoved, this));
            this._roomManagementModule.on("djAdded", _.bind(this._onDjAdded, this));
        },

        _attachCustomData: function () {
            var self = this;
            var keys = _.keys(this._roomManagementModule.currentUsers());

            keys.forEach(function (userId) {
                var user = self._roomManagementModule.currentUsers()[userId];

                // Make sure it's not already there.
                if (!user.userSession.customData("queue")) {
                    user.userSession.addCustomData("queue", { escortCount: 0, escortResetTimeoutId: null });
                }
            });
        },

        _onEnteredRoom: function () {
            this._attachCustomData();
        },

        _onUserJoined: function (user) {
            user.userSession.addCustomData("queue", { escortCount: 0, escortResetTimeoutId: null });
        },

        _onDjAdded: function (data) {
            var i;

            if (!this._isQueueOn) {
                return;
            }

            for (i = 0; i < this._stepUpQueue.length; ++i) {
                if (this._stepUpQueue[i].user.userId === data.userId) {
                    if (this._stepUpQueue[i].timeoutId) {
                        clearTimeout(this._stepUpQueue[i].timeoutId);
                        this._stepUpQueue[i].timeoutId = null;
                    }
                    return;
                }
            }

            // If we get here, it wasn't a valid step up. So pull them.
            this._escort(data);
        },

        _onDjRemoved: function (data) {
            var self = this;
            var position = -1;
            var i;

            if (!self._isQueueOn) {
                return;
            }

            // If the last DJ steps down, the next person to step up is the first person in the queue.
            if (self._lastDj && self._lastDj.userId === data.userId) {
                // Add the user that just DJ'd back into the queue.
                position = self._addUserToQueue(data);
                self._ttApi.pm("Thanks for DJing! You've been added to the queue, your current position is " + (position + 1), data.userId);
                self._lastDj = null;

                self._allowNextPersonInQueueToStepUp();
            } else {
                // Check if it was an early step down.
                for (i = 0; i < self._stepUpQueue.length; ++i) {
                    if (self._stepUpQueue[i].user.userId === data.userId) {
                        self._handleEarlyStepDown(self._stepUpQueue[i]);
                    }
                }
            }
        },

        _escort: function (dj) {
            this._ttApi.remDj(dj.userId);
            this._ttApi.speak(this._escortTemplate({ user: dj }));

            var queueData = dj.userSession.customData("queue");
            if (queueData) {
                queueData.escortCount += 1;
                if (queueData.escortCount >= this._queueConfig.escortOptions.bootAfter) {
                    clearTimeout(this._queueConfig.escortResetTimeoutId);
                    this._roomManagementModule.bootUser(dj.userId, this._bootTemplate({ user: dj }));
                } else {
                    if (queueData.escortResetTimeoutId) {
                        clearTimeout(queueData.escortResetTimeoutId);
                    }
                    queueData.escortResetTimeoutId = setTimeout(function () {
                        queueData.escortCount = 0;
                        queueData.escortResetTimeoutId = null;
                    }, this._queueConfig.escortOptions.resetTimeoutPeriod*1000);
                }
            }
        },

        _handleEarlyStepDown: function (dj) {
            var self = this;
            var pmMessage = self._stepDownPMTemplate({ user: dj.user, stepUpTimeout: this._queueConfig.stepUpTimeout });
            var chatMessage = self._stepDownChatTemplate({ user: dj.user, stepUpTimeout: this._queueConfig.stepUpTimeout });

            self._ttApi.pm(pmMessage, dj.user.userId);
            self._ttApi.speak(chatMessage);

            dj.timeoutId = setTimeout(function () {
                var i;
                // Make sure the user is in the stepUpQueue before allowing a new person to stepup.
                for (i = 0; i < self._stepUpQueue.length; ++i) {
                    if (self._stepUpQueue[i].user.userId === dj.user.userId && !self._isUserDJing(dj.user)) {
                        // They missed their chance. Move on to the next person.
                        self._stepUpQueue.splice(i, 1);
                        self._allowNextPersonInQueueToStepUp.apply(self);
                    }
                }
            }, this._queueConfig.stepUpTimeout*1000);
        },

        _allowNextPersonInQueueToStepUp: function () {
            var self = this;
            var chatResponse = null;
            var dj;
            var timeoutId;

            if (self._queue.length > 0) {
                dj = self._queue.splice(0, 1)[0];

                var timeoutId = setTimeout(function (dj) {
                    var i;

                    for (i = 0; i < self._stepUpQueue.length; ++i) {
                        if (self._stepUpQueue[i].user.userId === dj.userId && !self._isUserDJing(self._stepUpQueue[i].user)) {
                            self._queueStepUpMissed.apply(self, [dj]);
                            return;
                        }
                    }
                }, self._queueConfig.stepUpTimeout*1000, dj);

                self._stepUpQueue.push({ user: dj, timeoutId: timeoutId });

                var templateData = { user: dj, stepUpTimeout: self._queueConfig.stepUpTimeout };

                chatResponse = self._stepUpChatTemplate(templateData);
                self._ttApi.pm(self._setUpPMTemplate(templateData), dj.userId);

                // Notify the next person in line that their turn is coming up. (if there is someone).
                if (self._queue.length > 0) {
                    chatResponse += " " + self._onDeckTemplate({ user: self._queue[0] });
                }

                if (chatResponse) {
                    self._ttApi.speak(chatResponse);
                }
            }
        },

        // Fires when a user that was in the queue doesn't stepup in their alotted time period.
        _queueStepUpMissed: function (dj) {
            var i;

            // Remove the DJ from the step up queue and tell them they're being dequeued.
            for (i = 0; i < this._stepUpQueue.length; ++i) {
                if (this._stepUpQueue[i].user.userId === dj.userId) {
                    this._stepUpQueue.splice(i, 1);

                    this._ttApi.speak("@" + dj.userName + " you're being dequeued until you're not AFK anymore.");
                    break;
                }
            }

            // Allow the next person inline to stepup.
            this._allowNextPersonInQueueToStepUp();
        },

        _onSongEnded: function (dj, song) {
            if (!this._isQueueOn) {
                return;
            }

            this._lastDj = dj;

            this._ttApi.remDj(dj.userId);
        },

        _onSongStarted: function (dj, song) {
            var i;

            if (!this._isQueueOn) {
                return;
            }

            // Remove the current DJ from the step up queue.
            for (i = 0; i < this._stepUpQueue.length; ++i) {
                if (this._stepUpQueue[i].user.userId === this._roomManagementModule.currentDj().userId) {
                    this._stepUpQueue.splice(i, 1);
                }
            }
        },

        queueCommand: function (data, ttApi) {
            if (data.parameters.trim().length === 0) {
                this.addToQueue(data, ttApi);
            } else if (data.parameters.trim().toLowerCase() === 'on') {
                this.queueOn(data, ttApi);
            } else if (data.parameters.trim().toLowerCase() === 'off') {
                this.queueOff(data, ttApi);
            } else {
                if (data.user.userId === '509d34f2aaa5cd4b5baab6c2') {
                    ttApi.speak("What? Use your words @" + data.user.userName + "! Use your words.");
                } else {
                    ttApi.speak("You're speaking gibberish, kid.");
                }
            }
        },

        queueOn: function (data, ttApi) {
            var self = this;
            if (data.user.isModerator) {
                this._isQueueOn = true;
                ttApi.speak("The queue has been turned on. Hide yo kids, hide yo wife, and queue up!");

                var currentDjs = self._roomManagementModule.currentDjs();
                var currentDj = self._roomManagementModule.currentDj();

                self._roomManagementModule.currentDjs().forEach(function (dj){
                    if (currentDj.userId !== dj.userId) {
                        self._stepUpQueue.push({ user: dj, timeoutId: null });
                    }
                });
            }
        },

        queueOff: function (data, ttApi) {
            if (data.user.isModerator) {
                this._isQueueOn = false;
                this._queue = [];
                this._stepUpQueue = [];
                this._lastDj = null;
                ttApi.speak("The queue has been turned off.");
            }
        },

        addToQueue: function (data, ttApi) {
            var position = -1;
            var positionsFilled = -1;
            var currentDjs = this._roomManagementModule.currentDjs();

            if (!this._isQueueOn) {
                ttApi.speak("The queue isn't currently enabled @" + data.user.userName + ". Feel free to hop up when there's an opening!");
                return;
            } else if (this._isUserDJing(data.user)) {
                ttApi.speak("What? Now you want to take two DJ spots on stage @" + data.user.userName + "?");
                return;
            }

            position = this._addUserToQueue(data.user);

            // Allow them to step up if there's room.
            if (this._roomManagementModule.currentDjs().length + this._stepUpQueue.length < 5) {
                this._allowNextPersonInQueueToStepUp();
            } else {
                ttApi.speak("@" + data.user.userName + ", you've been added to queue. Your current position is " + (position + 1));
            }
        },

        _addUserToQueue: function (userInfo) {
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
                this._queue.push(userInfo);
                position = this._queue.length-1;
            }

            return position;
        },

        listQueue: function (data, ttApi) {
            var usersInQueue = null;
            var usersInStepUpQueue = null;
            var timeoutLength = 1;

            if (this._isQueueOn) {
                usersInQueue = this._usersInQueue();
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
        },

        dequeue: function (data, ttApi) {
            var i;

            if (!this._isQueueOn) {
                ttApi.speak("The queue's not enabled. You're drunk @" + data.user.userName + ". Go home.");
            }

            console.log(this._queue, this._stepUpQueue, data);
            for (i = 0; i < this._queue.length; ++i) {
                if (this._queue[i].userId === data.user.userId) {
                    this._queue.splice(i, 1);
                    ttApi.speak(this._dequeueTemplate({ user: data.user }));
                    return;
                }
            }

            for (i = 0; i < this._stepUpQueue.length; ++i) {
                if (this._stepUpQueue[i].user.userId === data.user.userId) {
                    if (this._stepUpQueue[i].timeoutId) {
                        clearTimeout(this._stepUpQueue[i].timeoutId);
                    }
                    this._stepUpQueue.splice(i, 1);
                    this._allowNextPersonInQueueToStepUp();
                    ttApi.speak(this._dequeueTemplate({ user: data.user }));
                    return;
                }
            }
        },

        _usersInQueue: function () {
            var users = [];
            for (var i = 0; i < this._queue.length; ++i) {
                users.push(this._queue[i].userName);
            }
        },

        _isUserDJing: function (user) {
            return user.userSession && user.userSession.isDJing;
        }
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        var queueCommandHandler = new QueueCommandHandler(commandsModule.roomManagementModule(), ttApi, botConfig.queue);

        commandsModule.registerCommandHandler({ botSpecific: true, command: "q" }, _.bind(queueCommandHandler.queueCommand, queueCommandHandler));
        commandsModule.registerCommandHandler({ botSpecific: true, command: "list"}, _.bind(queueCommandHandler.listQueue, queueCommandHandler));
        commandsModule.registerCommandHandler({ botSpecific: true, command: "dq"}, _.bind(queueCommandHandler.dequeue, queueCommandHandler));
    };

})();