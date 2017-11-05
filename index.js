var Discord = require('discord.io');
var request = require('request');
var sync = require('sync-request');
var fs = require('fs');
var _ = require('lodash');
var auth = require('./auth.json');
var zerorpc = require("zerorpc");

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

    var wstream = fs.createWriteStream('messages.txt');

    do {
        var res = sync('get', options.url, options);
        messages = JSON.parse(res.getBody().toString());
        //console.log(res.getBody().toString());
        console.log("GET " + messages.length + " messages");
        _.forEach(messages, function (message) {
            var line = message.author.username + ' (' + message.timestamp + ') ' + ': ' + message.content + '\n';
            wstream.write(line);
            //console.log(message.content);
        });
        options.url = 'https://discordapp.com/api/channels/220307845483069440/messages?before=' + messages[messages.length - 1].id + '&limit=100';
    } while (messages.length > 0);

    wstream.end();
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

