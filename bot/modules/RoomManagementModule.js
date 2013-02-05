(function () {

    var Listener = require("./../model/Listener.js");
    var eventEmitter = require('events').EventEmitter;
    var _ = require("underscore");

    var RoomManagementModule = function (ttApi, botConfig) {
        this.ttApi = ttApi;
        this._currentDjs = {};
        this._currentListeners = [];
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
        this.ttApi.on("nosong", _.bind(this._onNoSong, this));
    };

    RoomManagementModule.prototype._onNoSong = function (data) {

    };

    RoomManagementModule.prototype._onSongEnded = function (data) {
        // Increase the playcount for the DJ that just played.
        this._currentListeners[this._currentDjs[0]].increasePlayCount();

        this.emit("songEnded", data);
    };

    RoomManagementModule.prototype._onSongStarted = function (data) {
        this.emit("songStarted", data);
    };

    RoomManagementModule.prototype._onBotEnteredRoom = function (data) {
        var self = this;

        console.log("Hi there from: _onBotEnteredRoom");

        self._moderatorIds = [];
        self._currentListeners = {};
        self._currentDjs = [];
        self._currentDj = null;

        data.room.metadata.moderator_id.forEach(function (modId) {
            self._moderatorIds.push(modId);
        });

        data.users.forEach(function (user) {
            self._currentListeners[user.userid] = new Listener(user);
        });

        this._currentDjCount = data.room.metadata.djs.length;
        data.room.metadata.djs.forEach(function (djId) {
            self._currentDjs.push(djId);
        });
    };

    RoomManagementModule.prototype._onDJAdded = function (data) {
        var self = this;

        console.log("Hi there from: _onDJAdded");

        data.user.forEach(function (dj) {
            var newDj = self._currentListeners[dj.userid];

            self._currentDjs.push(dj.userid);
            self.emit("djAdded", newDj);
        });
    };

    RoomManagementModule.prototype._onDJRemoved = function (data) {
        var self = this;

        console.log("Hi there from: _onDJRemoved");

        data.user.forEach(function (dj) {
            var djId = dj.userid;

            var index = self._currentDjs.indexOf(djId);

            if (index > -1) {
                self._currentDjs.splice(index, 1);

                self._currentListeners[djId].resetPlayCount();
                self.emit("djRemoved", self._currentListeners[djId]);
            }
        });
    };

    RoomManagementModule.prototype._onListenerJoined = function (data) {
        var self = this;

        console.log("Hi there from: _onListenerJoined");
        data.user.forEach(function (user) {
            var newListener = new Listener(user);

            // We don't care about us joining the room, it's annoying but we have to check...
            if (newListener.userId !== self._botConfig.bot.credentials.userid) {
                self._currentListeners[newListener.userId()] = newListener;
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
        return this._currentDjs.length > 0 ? this._currentListeners[this._currentDjs[0]] : null;
    };

    RoomManagementModule.prototype.isAdmin = function (userId) {
        if (userId === this._botConfig.bot.admin || this._moderatorIds.indexOf(userId) > -1) {
            return true;
        }

        return false;
    };

    module.exports = RoomManagementModule;
})();