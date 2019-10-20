module.exports = {
    name: "volume",
    aliases: ['vol', 'v',],
    songPlaying: true,
    execute(args, message, serverQueue) {
        // If no args, tell them current volume
        if (!args.length) return message.channel.send(`Volume is currently at ${serverQueue.volume}`)

        // Set the volume
        const volumeAdjust = parseInt(args[0], 10);
        if (volumeAdjust >= 0 && volumeAdjust <= 100) {
            serverQueue.volume = volumeAdjust;
            serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume / 100);
            message.channel.send(`Volume now at ${volumeAdjust}`);
        } else {
            message.channel.send("Volume must be between 0 and 100.");
        }
    }
}