module.exports = {
    name: "skip",
    aliases: ['next'],
    songPlaying: true,
    execute(args, message, serverQueue) {
        serverQueue.connection.dispatcher.end();
    }
}