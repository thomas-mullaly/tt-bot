(function () {
    var User = function (userId, userName, joinDate) {
        this._userName = userName;
        this._userId = userId;
        this._isModerator = false;
        this._joinDate = joinDate;
        this._isModerator = false;
        this._userSession = null;
    };

    User.prototype = {
        userName: function () {
            return this._userName;
        },

        updateUserName: function (newUserName) {
            this._userName = newUserName;
        },

        userId: function () {
            return this._userId;
        },

        isModerator: function () {
            return this._isModerator;
        },

        setModerator: function (isModerator) {
            this._isModerator = isModerator;
        },

        setUserSession: function (userSession) {
            this._userSession = userSession;
        },

        userSession: function () {
            return this._userSession;
        },

        isInRoom: function () {
            return this._userSession !== null;
        }
    };

    module.exports = User;
})();