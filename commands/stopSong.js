module.exports = {
    name: "stop",
    aliases: ['end', 'finish'],
    songPlaying: true,
    execute(args, message, serverQueue) {
        // Clear all songs and end dispatcher.
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    }
}