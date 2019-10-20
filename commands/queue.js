// @ts-check
const Discord = require("discord.js")

module.exports = {
    name: 'queue',
    aliases: ['q'],
    songPlaying: true,
	/**
     * @param {{ channel: { send: (arg0: import("discord.js").RichEmbed) => void; }; }} message
     * @param {{ songs: { title: string; url: string; }[]; }} serverQueue
     */
	execute(args, message, serverQueue) {
        const queueSongs = serverQueue.songs
        let description = `__Now Playing:__\n[${queueSongs[0].title}](${queueSongs[0].url})\n\n__Up Next:__\n`
        
        for (let i = 0; i < queueSongs.length; i++) {
            if (i === 0) continue;
            if (description.length + `${i}. [${queueSongs[i].title}](${queueSongs[i].url})\n`.length <= 2033) {
            description += `${i}. [${queueSongs[i].title}](${queueSongs[i].url})\n`
            } else {
                description += `and ${queueSongs.length - i - 1} more...`
                break;
            }
        };

		let embed = new Discord.RichEmbed()
            .setTitle("Music Queue")
            .setColor("#fffff0")
            .setDescription(description)
            .setTimestamp()
            .setFooter("by Talha");

        message.channel.send(embed);
	},
};