(function () {
    var User = function (ttUserData) {
        this._userName = ttUserData.name;
        this._userId = ttUserData.userid;
        this._joinDate = ttUserData.created;
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
        }
    };

    module.exports = User;
})();