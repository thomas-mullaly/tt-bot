(function () {
    var UserSession = function () {
        this._playCount = 0;
        this._isDJing = false;
        this._customDataLookup = {};
    };

    UserSession.prototype = {
        playCount: function () {
            return this._playCount;
        },

        resetPlayCount: function () {
            this._playCount = 0;
        },

        isDJing: function () {
            return this._isDJing;
        },

        setDJing: function (isDJing) {
            this._isDJing = isDJing;
        },

        addCustomData: function (key, data) {
            if (this._customDataLookup.hasOwnProperty(key)) {
                throw "Custom data with the key '" + key + "' has already been added to this user sessions.";
            }

            this._customDataLookup[key] = data;
        },

        removeCustomData: function (key) {
            if (!this._customDataLookup.hasOwnProperty(key)) {
                throw "User session does not contain any custom data for key '" + key + "'";
            }

            delete this._customDataLookup[key];
        },

        customData: function (key) {
            if (this._customDataLookup.hasOwnProperty(key)) {
                return this._customDataLookup[key];
            }

            return null;
        }
    };

    module.exports = UserSession;
})();