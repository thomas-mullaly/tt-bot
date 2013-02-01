(function () {
    var Listener = function (ttUserData) {
        this._userName = ttUserData.name;
        this._userId = ttUserData.userid;
        this._joinDate = ttUserData.created;
        this._playCount = 0;
        this._escortCount = 0;
        this._isModerator = false;
    };

    Listener.prototype = {
        userName: function () {
            return this._userName;
        },

        updateUserName: function (newUserName) {
            this._userName = newUserName;
        },

        userId: function () {
            return this._userId;
        },

        joinDate: function () {
            return this._joinDate;
        },

        playCount: function () {
            return this._playCount;
        },

        increasePlayCount: function () {
            this._playCount += 1;
        },

        resetPlayCount: function () {
            this._playCount = 0;
        },

        escortCount: function () {
            return this._escortCount;
        },

        increaseEscortCount: function () {
            this._escortCount += 1;
        },

        isModerator: function () {
            return this._isModerator;
        },

        updateModeratorStatus: function (isModerator) {
            this._isModerator = isModerator;
        }
    };

    module.exports = Listener;
})();