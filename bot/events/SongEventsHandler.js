(function () {
    var SongEventsHandler = function (TTBot) {
        var ttApi = TTBot.getTTApi();
        var proxy = require(TTBot.PROJECT_DIR + "/Utils.js").proxy;

        ttApi.on("endsong", proxy(this, this.endSong));
    };

    SongEventsHandler.prototype.endSong = function (data) {
        console.log("Song ended");
    };

    exports.registerEventHandler = function (TTBot) {
        var songEventsHandler = new SongEventsHandler(TTBot);
    };
})