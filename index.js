var Discord = require('discord.io');
var request = require('request');
var auth = require('./auth.json');

var bot = new Discord.Client({
	token: auth.token,
	autorun: true
});

bot.on('ready', function (event) {
	console.log('Connected');
	console.log('Logged in as: ');
	console.log(bot.username + ' - ' + bot.id);

});

bot.on('message', function (user, userID, channelID, message, event) {
	if (message.substring(0, 1) == '!') {
		var args = message.substring(1).split(' ');
		var cmd = args[0];
		switch (cmd) {
			case 'test':
				bot.sendMessage({
					to: channelID,
					message: 'It works!'
				});
			break;
		}
	}
});

