var Discord = require('discord.io');
var request = require('request');
var sync = require('sync-request');
var fs = require('fs');
var _ = require('lodash');
var auth = require('./auth.json');
var latestMessages = require('./latest.json');
var zerorpc = require("zerorpc");
var exec = require('child_process').exec;

var discordApi = 'https://discordapp.com/api/';

var dataStore = 'markovgen/corpora/';

var channels = ["220307845483069440", "110114161098248192"];

var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

var host = "127.0.0.1";
var port = 8000;
var client = new zerorpc.Client();
client.connect("tcp://" + host + ":" + port);

bot.on('ready', function (event) {
    console.log('Connected');
    console.log('Logged in as: ');
    console.log(bot.username + ' - ' + bot.id);

    var botsAvailable = ['ronald-bot.js', 'mac-bot.js', 'keenan-bot.js', 'asher-bot.js', 'ben-bot.js'];
    for (var i = 0; i < botsAvailable.length; i++) {
        try {
            var botPort = port + 1 + i;
            var cmd = 'node ' + botsAvailable[i] + ' ' + botPort;
            exec(cmd);
        } catch (err) {
            console.log(err);
        }
    }

    var options = {
        url: "",
        headers: {
            'User-Agent':'request',
            'Authorization': bot.internals.token,
            'Content-type': 'application/json'
        }
    }

    //fetchText(options, channels);
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
                        message: 'It works!' + res + ' ChannelID' + channelID
                    });
                });

                break;
            case 'build':
            	var author = "71716577669550080";

            	client.invoke("createModel", author + ".txt", author, function(error, res, more) {
                    console.log(res);
                    bot.sendMessage({
                        to: channelID,
                        message: 'Model ' + author + ' created.'
                    });
                });

                break;
            case 'query':
	            var author = "71716577669550080";

	            client.invoke("readModel", author, 1, function(error, res, more) {
	            	console.log(res);
	            	bot.sendMessage({
	            		to: channelID,
	            		message: res[0]
	            	});
	            });

	            break;

        }
    }
});

function fetchText(options,channels){

    var messages = [];
    var writers = {};
    var authors = [];
    var firstTime = true;

    var counter = 0;
    for (var i = 0; i < channels.length; i++) {
        options.url = discordApi + 'channels/' + channels[i] + '/messages?limit=100';
        console.log(options.url);
        while (true) {
            var res = sync('get', options.url, options);
            messages = JSON.parse(res.getBody().toString());
            counter += messages.length;
            console.log("GET " + messages.length + " messages: " + counter + "!");

            _.forEach(messages, function (message) {
                if (writers[message.author.id] == undefined) {
                    writers[message.author.id] = fs.openSync(dataStore + message.author.id + '.txt', 'w');
                    authors.push(message.author)
                }
                //split current line on sentences based on punctuation followed by at least one space
     			var lines = message.content.replace(/([.?!])\s+(?=[a-zA-Z\d])/g, "$1|").split("|")
     			_.forEach(lines, function(line){
     				//for each sentence, write it as a new line
                	fs.writeSync(writers[message.author.id], line + '\n');
     			});
            });
            if (messages.length > 0) {
                options.url = discordApi + 'channels/' + channels[i] + '/messages?before=' + messages[messages.length - 1].id + '&limit=100';
            } else {
                break;
            }
        }
    }

    for (var property in writers) {
        if (writers.hasOwnProperty(property)) {
            fs.closeSync(writers[property]);
        }
    }

    _.forEach(authors, function(author) {
    	console.log("Author map")
    	console.log(author.id, author.username)
    })


}