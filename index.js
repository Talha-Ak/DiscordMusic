// @ts-check

process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection: ', error));

// Dependencies
const fs = require("fs");
const Discord = require("discord.js");
// @ts-ignore
const { prefix, token, apiKey } = require("./config.json");
const ytdl = require("ytdl-core");
const YouTube = require("simple-youtube-api");

console.log("Discord Music Bot (by Talha)");

// Create Discord, Youtube client and music queue
const client = new Discord.Client();
const youtube = new YouTube(apiKey);
const queue = new Map();
const lockList = new Map();
let badbot = 0;
let goodbot = 0;

// Import all commands in their external js files
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    console.log(`Loaded in ${file}`)
}

// Login to Discord
console.log("Logging in to Discord...");
client.login(token);

// Log when status changes
client.once('ready', () => {
    console.log('Ready!');
});
client.once('reconnecting', () => {
    console.log('Reconnecting...');
});
client.once('disconnect', () => {
    console.log('Disconnected.');
});

// When message is received...
client.on("message", async message => {

    // If it's the bot or if it doesnt start with cmd prefix, ignore.
    if (message.author.bot || !message.content.startsWith(prefix)) return;
    // If the message is inside a dm, ignore.
    if (message.channel.type === "dm") return message.channel.send("I can't reply to DMs.");
    // If the bot is "locked" to the user, ignore.
    if (userIsLockedOut(message)) return message.channel.send("The bot is currently locked to admins only.");

    const args = message.content.trim().slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    const serverQueue = queue.get(message.guild.id);

    // Conditional to run different branches based on cmd.
    if (commandName === "play" || commandName === "p") {
        execute(args, message, serverQueue);
        return;
    } else if (commandName === "lock") {
        lockToAdmins(message);
        return;
    } else if (commandName === "badbot") {
        badbot += 1;
        message.channel.send(`:( (Times I've been called badbot: ${badbot})`)
    } else if (commandName === "goodbot") {
        goodbot += 1;
        message.channel.send(`:) (Times I've been called goodbot: ${goodbot})`)
    } else {
        // Find the command from the list of external js files (or their aliases)...
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return message.channel.send(`That command does not exist. Use ${prefix}help if you're stuck.`);
        // If the command requires a song to be playing, test for that and let user know if criteria isn't met.
        if (command.songPlaying) {
            if (!message.member.voiceChannel) {
                return message.reply("You need to be in a voice channel.")
            }
            if (!serverQueue) {
                return message.reply("A song needs to be playing.")
            }
        }

        try {
            command.execute(args, message, serverQueue);
        } catch (error) {
            console.error(error);
            message.reply("An error occured trying to do that...");
        }
    }
})

/**
 * @param {import("discord.js").Message} message
 * @param {{ songs: { title: string; url: string; }[]; }} serverQueue
 * @param {string[]} args
 */
async function execute(args, message, serverQueue) {

    if (!inVcAndHasPerms(message)) return message.reply("You need to be in a voice channel to do that (or I might not have the permissions needed)");
    if (!args.length) return message.reply(`Usage: ${prefix}play | ${prefix}p <YouTube URL or query>`);
    if (!args[0].startsWith("https://") || args[0].includes("youtube.com/playlist")) return searchYoutube(args, message, serverQueue);

    let song = [];

    // Get song info from youtube
    try {
        const songInfo = await ytdl.getInfo(args[0]);
        if (songInfo.title && songInfo.video_url) {
            song.push({
                title: songInfo.title,
                url: songInfo.video_url
            });
        } else { throw Error("Title or URL is empty") }
    } catch (e) {
        console.error(e);
        return message.reply(`Couldn't get \`${args[0]}, video might be private, blocked or just doesn't exist.`);
    }

    addToQueue(song, message, serverQueue);
}

/**
 * @param {string[]} args
 * @param {import("discord.js").Message} message
 */
async function searchYoutube(args, message, serverQueue) {
    if (!inVcAndHasPerms(message)) return message.reply("You need to be in a voice channel to do that (or I might not have the permissions needed)");
    if (!args.length) return message.reply(`Usage: ${prefix}play | ${prefix}p <YouTube URL or query>`)

    const searchQuery = args.join(" ");
    // Try to search for the given YouTube query, if it's a playlist get all the videos from that playlist.
    const sentMsg = await message.channel.send(`:arrows_counterclockwise:  Searching on YouTube: \`${searchQuery}\``);
    if (searchQuery.includes("youtube.com/playlist")) {
        let playlist;
        try {
            playlist = await youtube.searchPlaylists(searchQuery, 1);
            sentMsg.edit(`:white_check_mark:  Found playlist: \`${playlist[0].title}\``);
        } catch (e) {
            console.error(e)
            return message.reply(`Couldn't get \`${args[0]}, playlist might be private, blocked or just doesn't exist.`);
        }
        // @ts-ignore
        const playlistVideos = await playlist[0].getVideos();
        let songs = []
        playlistVideos.forEach(video => {
            if (video.title && video.url) {
                songs.push({
                    title: video.title,
                    url: video.url
                });
            }
        });
        console.log(`Songs: ${songs}`)
        addToQueue(songs, message, serverQueue);
    } else {
        const video = await youtube.searchVideos(searchQuery, 1);
        // @ts-ignore
        sentMsg.edit(`:white_check_mark:  Found video: \`${video[0].title}\``);
        execute([video[0].url], message, serverQueue);
    }
}

async function addToQueue(songs, message, serverQueue) {
    const voiceChannel = message.member.voiceChannel;

    if (!serverQueue) {
        // If no server queue, make one and add it.
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 30,
            playing: true
        };
        queue.set(message.guild.id, queueConstruct)
        queueConstruct.songs.push(...songs);

        try {
            // Try join vc and save the connection
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(message.guild, queueConstruct.songs[0]);
        } catch (e) {
            console.log(e);
            queue.delete(message.guild.id);
            return message.channel.send(e);
        }

    } else {
        // If there is a queue, just add the song.
        // @ts-ignore
        serverQueue.songs.push(...songs);
        console.log(`Added more songs`);
        return message.channel.send(`Added it to the queue (${prefix}q to see the current queue)`);
    }
}

/**
 * @param {import("discord.js").Guild} guild
 * @param {{ url: string; }} song
 */
function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    // If there's no song left, leave the vc
    if (!song) {
        serverQueue.textChannel.send(":musical_note:  All songs have been played. Leaving the voice channel.")
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    serverQueue.connection.playStream(ytdl(song.url))
        .on('end', () => {
            // Delete song and start next one.
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => {
            console.error(error);
        });
    serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume / 100);
    serverQueue.textChannel.send(`:musical_note:  Now playing: \`${serverQueue.songs[0].title}\``);

}

function inVcAndHasPerms(message) {
    // Check if user is in a vc
    const voiceChannel = message.member.voiceChannel;
    if (!message.member.voiceChannel) return false;

    // Check if bot has perms for their vc
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) return false;
    return true;
}

/**
 * @param {import("discord.js").Message} message
 */
function lockToAdmins(message) {
    // If the user is not an admin, ignore.
    if (!(message.member.hasPermission("ADMINISTRATOR", true, true, true) || message.member.roles.find(r => r.name === "DJ"))) {
        return message.reply("You need to be an admin or have a role labelled `DJ` to use this command.");
    }
    if (lockList.get(message.guild.id)) {
        lockList.set(message.guild.id, false);
        message.channel.send("Music bot unlocked.");
    } else {
        lockList.set(message.guild.id, true);
        message.channel.send("Music bot now locked to admins/DJs only.")
    }
}

/**
 * @param {import("discord.js").Message} message
 */
// If the server is not locked, or if the user is an admin, let the message pass. Otherwise don't.
function userIsLockedOut(message) {
    const userIsAdminOrDj = message.member.hasPermission("ADMINISTRATOR", true, true, true) || message.member.roles.find(r => r.name === "DJ");
    return !userIsAdminOrDj && lockList.get(message.guild.id);
}