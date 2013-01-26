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
        this._botConfig = botConfig;

        this._registerToTTEvents();
    };

    RoomManagementModule.prototype = eventEmitter.prototype;

    RoomManagementModule.prototype._registerToTTEvents = function () {
        this.ttApi.once("roomChanged", utils.proxy(this, this._onBotEnteredRoom));
        this.ttApi.on("add_dj", utils.proxy(this, this._onDJAdded));
        this.ttApi.on("rem_dj", utils.proxy(this, this._onDJRemoved));
        this.ttApi.on("registered", utils.proxy(this, this._onDJJoined));
        this.ttApi.on("deregistered", utils.proxy(this, this._onDJLeft));
    };

    RoomManagementModule.prototype._onBotEnteredRoom = function (data) {
        var self = this;

        data.users.forEach(function (value) {
            console.log(value);
            self._currentListeners[value.userid] = createDjModel(value);
        });

        console.log(this._currentListeners);
    };

    RoomManagementModule.prototype._onDJAdded = function (data) {
        var newDj = this._currentListeners[data.userid];

        this._currentDjs[newDj.userId] = newDj;

        this.emit("djAdded", newDj);
    };

    RoomManagementModule.prototype._onDJRemoved = function (data) {
        var removedDj = this._currentDjs[data.userid];

        // Something horrible has happened if this doesn't evaluate to true.
        if (removedDj) {
            delete this._currentDjs[data.userid];
            this.emit("djRemoved", removedDj);
        }
    };

    RoomManagementModule.prototype._onDJJoined = function (data) {
        console.log(data);
        var newListener = createDjModel(data);

        // We don't care about us joining the room, it's annoying but we have to check...
        if (newListener.userId !== this._botConfig.bot.credentials.userid) {
            this._currentListeners[newListener.userId] = newListener;
        }
    };

    RoomManagementModule.prototype._onDJLeft = function (data) {
        console.log(data);

        var dj = this._currentListeners[data.userid];
        if (dj) {
            delete this._currentListeners[dj.userId];
        }
    };

    RoomManagementModule.prototype.currentDjs = function () {
        return this._currentDjs;
    };

    module.exports = RoomManagementModule;
})();