var Discord = require('discord.io');
var request = require('request');
var auth = require('./auth.json');
var zerorpc = require("zerorpc");

var bot = new Discord.Client({
	token: auth.token,
	autorun: true
});

var host = "localhost";
var port = 8000;
var client = new zerorpc.Client();
client.connect("tcp://" + host + ":" + port);

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

				//invokes the function hello with the param "RPC" on the python server
				client.invoke("hello", "RPC", function(error, res, more) {
					console.log(res);
					bot.sendMessage({
						to: channelID,
						message: 'It works!' + res
					});
				});

				break;
		}
	}
});

