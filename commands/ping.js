module.exports = {
	name: 'ping',
	execute(args, message, serverQueue) {
		message.channel.send('Pong.');
	},
};