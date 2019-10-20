// @ts-check
const Discord = require("discord.js")

module.exports = {
    name: 'help',
    /**
     * @param {import("discord.js").Message} message
     */
    execute(args, message, serverQueue) {
        let embed = new Discord.RichEmbed()
            .setAuthor("Music bot")
            .setTitle("Help menu")
            .setColor("#fffff0")
            .setDescription("Prefix any commands given with '$'\n")
            .addField("Play music", "play | p <YT URL/query>", true)
            .addField("Check music queue", "queue | q", true)
            .addField("Skip current track", "skip | next", true)
            .addField("Stop music", "stop | end | finish", true)
            .addField("Volume (Default: 30)", "volume | vol | v <volume>", true)
            .addField("Lock bot (Admin/DJs)", "lock", true)
            .setTimestamp()
            .setFooter("by Talha");
 
        message.channel.send(embed);
    },
};