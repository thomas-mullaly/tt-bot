(function () {
    var User = function (ttUserData) {
        this._userName = ttUserData.name;
        this._userId = ttUserData.userid;
        this._isModerator = false;
        this._joinDate = ttUserData.created;
        this._isModerator = false;
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
        }
    };

    module.exports = User;
})();