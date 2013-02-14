(function () {
    "use strict";

    var User = require("./../model/User.js");
    var UserSession = require("./../model/UserSession.js");
    var eventEmitter = require('events').EventEmitter;
    var _ = require("underscore");

    var RoomManagementModule = function (ttApi, botConfig) {
        this._ttApi = ttApi;
        this._botConfig = botConfig;

        this._moderatorIds = [];
        this._users = {};
        this._currentDjs = [];

        this._registerToTTEvents();
    };

    RoomManagementModule.prototype = eventEmitter.prototype;

    RoomManagementModule.prototype._registerToTTEvents = function () {
        this._ttApi.on("roomChanged", _.bind(this._onEnteredRoom, this));
        this._ttApi.on("registered", _.bind(this._onUserJoined, this));
        this._ttApi.on("deregistered", _.bind(this._onUserLeft, this));
        this._ttApi.on("add_dj", _.bind(this._onDjAdded, this));
        this._ttApi.on("rem_dj", _.bind(this._onDjRemoved, this));
        this._ttApi.on("escort", _.bind(this._onEscort, this));
        this._ttApi.on("newsong", _.bind(this._onSongStarted, this));
        this._ttApi.on("endsong", _.bind(this._onSongEnded, this));
    };

    RoomManagementModule.prototype._onEnteredRoom = function (eventData) {
        var self = this;

        self._resetModule();

        self._moderatorIds = eventData.room.metadata.moderator_id;

        eventData.users.forEach(function (userData) {
            var user = new User(userData.userid, userData.name, userData.created);

            user.isModerator = self.isModerator(userData.userid);
            user.userSession = new UserSession();

            self._users[userData.userid] = user;
        });

        eventData.djids.forEach(function (userId) {
            var dj = self._users[userId];

            dj.userSession.isDJing = true;

            self._currentDjs.push(dj);
        });
    };

    RoomManagementModule.prototype._onUserJoined = function (eventData) {
        var self = this;

        eventData.user.forEach(function (userData) {
            var user = new User(userData.userid, userData.name, userData.created);

            // We don't care about us joining the room, it's annoying but we have to check...
            if (user.userId !== self._botConfig.bot.credentials.userid) {
                user.isModerator = self.isModerator(userData.userid);
                user.userSession = new UserSession();

                self._users[user.userId] = user;
                self.emit("userJoined", user);
            }
        });
    };

    RoomManagementModule.prototype._onUserLeft = function (eventData) {
        var self = this;

        eventData.user.forEach(function (userData, index) {
            var user = self._users[userData.userid];

            user.userSession = null;

            delete self._users[userData.userid];
            self.emit("userLeft", user);
        });
    };

    RoomManagementModule.prototype._onDjAdded = function (eventData) {
        var self = this;

        eventData.user.forEach(function (user) {
            var newDj = self._users[user.userid];

            newDj.userSession.isDJing = true;

            self._currentDjs.push(newDj);
            self.emit("djAdded", newDj);
        });
    };

    RoomManagementModule.prototype._onDjRemoved = function (eventData) {
        var self = this;

        eventData.user.forEach(function (user) {
            var removedDj = self._users[user.userid];

            removedDj.userSession.isDJing = false;

            self._removeDjFromList(user.userid);
            self.emit("djRemoved", removedDj);
        });
    };

    RoomManagementModule.prototype._onEscort = function (eventData) {
        var self = this;

        eventData.user.forEach(function (user) {
            var escortedDj = self._users[user.userid];

            escortedDj.userSession.isDJing = false;

            self.emit("escort", escortedDj);
        });
    };

    RoomManagementModule.prototype._onSongStarted = function (eventData) {
        console.log(eventData.room.metadata);
    };

    RoomManagementModule.prototype._onSongEnded = function (eventData) {
        console.log(eventData.room.metadata);
    };

    RoomManagementModule.prototype._removeDjFromList = function (userId) {
        for (var i = 0; i < this._currentDjs.length; ++i) {
            if (this._currentDjs[i].userId === userId) {
                this._currentDjs.splice(i, 1);
                break;
            }
        }
    };

    RoomManagementModule.prototype._findUser = function (userId) {
        if (this._users.hasOwnProperty(userId)) {
            return this._users[userId];
        }

        return null;
    };

    RoomManagementModule.prototype._resetModule = function () {
        this._users = {};
        this._moderatorIds = [];
    };

    RoomManagementModule.prototype.isModerator = function (userId) {
        return _(this._moderatorIds).contains(userId) || this._botConfig.bot.admin === userId;
    };

    RoomManagementModule.prototype.currentUsers = function () {
        return this._users;
    };

    RoomManagementModule.prototype.currentDjs = function () {
        return this._currentDjs;
    };

    RoomManagementModule.prototype.currentDj = function () {
        return this._currentDjs.length > 0 ? this._currentDjs[0] : null;
    };

    RoomManagementModule.prototype.getUserFromId = function (userId) {
        return this._findUser(userId);
    };

    RoomManagementModule.prototype.isUserInRoom = function (userId) {
        return this._findUser(userId) !== null;
    };

    module.exports = RoomManagementModule;
})();