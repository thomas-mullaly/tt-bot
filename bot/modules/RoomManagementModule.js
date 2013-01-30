(function () {

    var utils = require("./../Utils.js");
    var eventEmitter = require('events').EventEmitter;
    var _ = require("underscore");

    var createDjModel = function (data) {
        return {
            playCount: 0,
            escortCount: 0,
            userName: data.name,
            userId: data.userid
        }
    };

    var RoomManagementModule = function (ttApi, botConfig) {
        this.ttApi = ttApi;
        this._currentDjs = {};
        this._currentDjCount = 0;
        this._currentDj = null;
        this._currentListeners = {};
        this._currentSong = {};
        this._moderatorIds = [];
        this._botConfig = botConfig;

        this._registerToTTEvents();
    };

    RoomManagementModule.prototype = eventEmitter.prototype;

    RoomManagementModule.prototype._registerToTTEvents = function () {
        this.ttApi.once("roomChanged", _.bind(this._onBotEnteredRoom, this));
        this.ttApi.on("add_dj", _.bind(this._onDJAdded, this));
        this.ttApi.on("rem_dj", _.bind(this._onDJRemoved, this));
        this.ttApi.on("registered", _.bind(this._onListenerJoined, this));
        this.ttApi.on("deregistered", _.bind(this._onListenerLeft, this));
        this.ttApi.on("endsong", _.bind(this._onSongEnded, this));
        this.ttApi.on("newsong", _.bind(this._onSongStarted, this));
    };

    RoomManagementModule.prototype._onSongEnded = function (data) {
        // Increase the playcount for the DJ that just played.
        this._currentDj.playCount += 1;

        this.emit("songEnded", data);
    };

    RoomManagementModule.prototype._onSongStarted = function (data) {
        this._currentDj = this._currentListeners[data.room.metadata.current_dj];
        this.emit("songStarted", data);
    };

    RoomManagementModule.prototype._onBotEnteredRoom = function (data) {
        var self = this;

        console.log("Hi there from: _onBotEnteredRoom");

        self._moderatorIds = [];
        self._currentListeners = {};
        self._currentDjs = {};
        self._currentDj = null;

        data.room.metadata.moderator_id.forEach(function (value) {
            self._moderatorIds.push(value);
        });

        data.users.forEach(function (value) {
            self._currentListeners[value.userid] = createDjModel(value);
        });

        this._currentDjCount = data.room.metadata.djs.length;
        data.room.metadata.djs.forEach(function (value) {
            var dj = self._currentListeners[value];
            self._currentDjs[value] = dj;
        });

        if (data.room.metadata.current_dj) {
            self._currentDj = self._currentListeners[data.room.metadata.current_dj];
        }
    };

    RoomManagementModule.prototype._onDJAdded = function (data) {
        var self = this;

        console.log("Hi there from: _onDJAdded");

        this._currentDjCount += data.user.length;
        data.user.forEach(function (dj) {
            var newDj = self._currentListeners[dj.userid];

            self._currentDjs[newDj.userId] = newDj;

            self.emit("djAdded", newDj);
        });
    };

    RoomManagementModule.prototype._onDJRemoved = function (data) {
        var self = this;

        console.log("Hi there from: _onDJRemoved");

        this._currentDjCount -= data.user.length;
        data.user.forEach(function (dj) {
            var removedDj = self._currentDjs[dj.userid];

            // Something horrible has happened if this doesn't evaluate to true.
            if (removedDj) {
                delete self._currentDjs[data.userid];
                self.emit("djRemoved", removedDj);
            }
        });
    };

    RoomManagementModule.prototype._onListenerJoined = function (data) {
        var self = this;

        console.log("Hi there from: _onListenerJoined");
        data.user.forEach(function (user) {
            var newListener = createDjModel(user);

            // We don't care about us joining the room, it's annoying but we have to check...
            if (newListener.userId !== self._botConfig.bot.credentials.userid) {
                self._currentListeners[newListener.userId] = newListener;
            }
        });
    };

    RoomManagementModule.prototype._onListenerLeft = function (data) {
        console.log("Hi there from: _onListenerLeft");

        var dj = this._currentListeners[data.userid];
        if (dj) {
            delete this._currentListeners[dj.userId];
        }
    };

    RoomManagementModule.prototype.currentDjs = function () {
        return this._currentDjs;
    };

    RoomManagementModule.prototype.currentListeners = function () {
        return this._currentListeners;
    };

    RoomManagementModule.prototype.currentDj = function () {
        return this._currentDj;
    };

    RoomManagementModule.prototype.currentDjCount = function () {
        return this._currentDjCount;
    };

    RoomManagementModule.prototype.isAdmin = function (userId) {
        if (userId === this._botConfig.bot.admin || this._moderatorIds.indexOf(userId) > -1) {
            return true;
        }

        return false;
    };

    module.exports = RoomManagementModule;
})();