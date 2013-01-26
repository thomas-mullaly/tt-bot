(function () {

    var utils = require("./../Utils.js");
    var eventEmitter = require('events').EventEmitter

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
        this._currentListeners = {};
        this._currentSong = {};
        this._moderatorIds = [];
        this._botConfig = botConfig;

        this._registerToTTEvents();
    };

    RoomManagementModule.prototype = eventEmitter.prototype;

    RoomManagementModule.prototype._registerToTTEvents = function () {
        this.ttApi.once("roomChanged", utils.proxy(this, this._onBotEnteredRoom));
        this.ttApi.on("add_dj", utils.proxy(this, this._onDJAdded));
        this.ttApi.on("rem_dj", utils.proxy(this, this._onDJRemoved));
        this.ttApi.on("registered", utils.proxy(this, this._onListenerJoined));
        this.ttApi.on("deregistered", utils.proxy(this, this._onListenerLeft));
        this.ttApi.on("endsong", utils.proxy(this, this._onSongEnded));
    };

    RoomManagementModule.prototype._onSongEnded = function (data) {
        //console.log(data);
        this.emit("songEnded")
    };

    RoomManagementModule.prototype._onBotEnteredRoom = function (data) {
        var self = this;

        data.room.metadata.moderator_id.forEach(function (value) {
            self._moderatorIds.push(value);
        });

        console.log("Hi there from: _onBotEnteredRoom");
        data.users.forEach(function (value) {
            self._currentListeners[value.userid] = createDjModel(value);
        });
    };

    RoomManagementModule.prototype._onDJAdded = function (data) {
        var self = this;

        console.log("Hi there from: _onDJAdded");
        data.user.forEach(function (dj) {
            var newDj = self._currentListeners[dj.userid];

            self._currentDjs[newDj.userId] = newDj;

            self.emit("djAdded", newDj);
        });
    };

    RoomManagementModule.prototype._onDJRemoved = function (data) {
        console.log("Hi there from: _onDJRemoved");
        var removedDj = this._currentDjs[data.userid];

        // Something horrible has happened if this doesn't evaluate to true.
        if (removedDj) {
            delete this._currentDjs[data.userid];
            this.emit("djRemoved", removedDj);
        }
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

    RoomManagementModule.prototype.isAdmin = function (userId) {
        if (userId === this._botConfig.bot.admin || this._moderatorIds.indexOf(userId) > -1) {
            return true;
        }

        return false;
    };

    module.exports = RoomManagementModule;
})();