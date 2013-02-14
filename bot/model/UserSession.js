(function () {
    var UserSession = function () {
        this.playCount = 0;
        this.isDJing = false;
        this._customDataLookup = {};
    };

    UserSession.prototype = {
        resetPlayCount: function () {
            this._playCount = 0;
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