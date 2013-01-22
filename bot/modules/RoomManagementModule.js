(function () {

    var utils = require("./../Utils.js");

    var createDjModel = function (data) {
        return {
            playcount: 0,
            name: data.name
        }
    };

    var RoomManagementModule = function (ttApi) {
        this.ttApi = ttApi;
        this.currentDjs = [];

        this._registerToTTEvents();
    };

    RoomManagementModule.prototype._registerToTTEvents = function () {
        this.ttApi.on("add_dj", utils.proxy(this, this._onDJAdded));
    };

    RoomManagementModule.prototype._onDJAdded = function (data) {
        console.log(data);
        this.currentDjs.push()
    };

    module.exports = RoomManagementModule;
})();