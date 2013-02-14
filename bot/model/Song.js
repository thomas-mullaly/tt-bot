(function () {
    var Song = function (ttSong) {
        this.artist = ttSong.metadata.artist;
        this.album = ttSong.metadata.album;
        this.genre = ttSong.metadata.genre;
        this.coverArt = ttSong.metadata.coverart;
        this.lengthInSeconds = ttSong.metadata.length;
    };

    module.exports = Song;
})();