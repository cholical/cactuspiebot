var Discord = require('discord.io');
var request = require('request');
var sync = require('sync-request');
var fs = require('fs');
var _ = require('lodash');
var auth = require('./auth.json');

var bot = new Discord.Client({
	token: auth.token,
	autorun: true
});

bot.on('ready', function (event) {
	console.log('Connected');
	console.log('Logged in as: ');
	console.log(bot.username + ' - ' + bot.id);


	var options = {
		url: 'https://discordapp.com/api/channels/220307845483069440/messages?limit=100',
		headers: {
			'User-Agent':'request',
			'Authorization': bot.internals.token,
			'Content-type': 'application/json'
		}
	}

	var messages = [];
	var firstTime = true;
	var done = true;

	do {
		var res = sync('get', options.url, options);
		console.log(res);
		messages = JSON.parse(res.getBody('utf8'));
		_.forEach(messages, function (message) {
			var line = message.author.username + ' (' + message.timestamp + ') ' + ': ' + message.content + '\n';
			fs.appendFile('messages.txt', line);
		});
		options.url = 'https://discordapp.com/api/channels/220307845483069440/messages?before=' + messages[messages.length - 1].id + '&limit=100';
	} while (messages.length > 0);
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

