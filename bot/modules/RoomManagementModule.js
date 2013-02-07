(function () {
    "use strict";

    var User = require("./../model/User.js");
    var eventEmitter = require('events').EventEmitter;
    var _ = require("underscore");

    var RoomManagementModule = function (ttApi, botConfig) {
        this._ttApi = ttApi;

        this._users = [];

        this._registerToTTEvents();
    };

    RoomManagementModule.prototype = eventEmitter.prototype;

    RoomManagementModule.prototype._registerToTTEvents = function () {
        this._ttApi.on("roomChanged", _.bind(this._onEnteredRoom, this));
        this._ttApi.on("registered", _.bind(this._onUserJoined, this));
        this._ttApi.on("deregistered", _.bind(this._onUserLeft, this));
    };

    RoomManagementModule.prototype._onEnteredRoom = function (eventData) {
        var self = this;
        self._resetModule();

        eventData.users.forEach(function (userData) {
            self._users.push(new User(userData));
        });
    };

    RoomManagementModule.prototype._onUserJoined = function (eventData) {
        var self = this;

        eventData.user.forEach(function (userData) {
            var user = new User(userData);
            self._users.push(user);
            self.emit("userJoined", user);
        });
    };

    RoomManagementModule.prototype._onUserLeft = function (eventData) {
        var self = this;

        eventData.user.forEach(function (userData, index) {
            var user = self._users[userData.userid];
            self._users.splice(index, 1);
            self.emit("userLeft", user);
        });
    };

    RoomManagementModule.prototype._findUser = function (userId) {
        for (var i = 0; i < this._users.length; ++i) {
            if (this._users[i].userId() === userId) {
                return this._users[i];
            }
        }

        return null;
    };

    RoomManagementModule.prototype._resetModule = function () {
        this._users = [];
    };

    RoomManagementModule.prototype.currentUsers = function () {
        return this._users;
    };

    RoomManagementModule.prototype.getUserFromId = function (userId) {
        return this._findUser(userId);
    };

    RoomManagementModule.prototype.isUserInRoom = function (userId) {
        return this._findUser(userId) !== null;
    };

    module.exports = RoomManagementModule;
})();