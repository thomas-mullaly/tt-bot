(function () {
    var User = function (userId, userName, joinDate) {
        this.userName = userName;
        this.userId = userId;
        this.isModerator = false;
        this.joinDate = joinDate;
        this.isModerator = false;
        this.userSession = null;
    };

    User.prototype = {
        isInRoom: function () {
            return this._userSession !== null;
        }
    };

    module.exports = User;
})();