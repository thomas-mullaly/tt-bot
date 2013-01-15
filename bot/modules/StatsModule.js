(function () {
    "use strict";

    var StatsModule = function (ttApi, util) {
        ttApi.on("songended", util.proxy(this, this.onSongEnded));
    };

    StatsModule.prototype.onSongEnded = function (data) {

    };

    module.exports = StatsModule;
})();