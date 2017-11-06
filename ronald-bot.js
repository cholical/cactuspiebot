var express = require('express');
var Discord = require('discord.io');
var auth = require('./auth.json');
var bodyParser = require('body-parser');
var app = express();
var port = parseInt(process.argv[2]);
var botauth = require('./botauth.json');

var bot = new Discord.Client({
    token: botauth.ronaldToken,
    autorun: true
});


bot.on('ready', function (event) {
    console.log('Connected');
    console.log('Logged in as: ');
    console.log(bot.username + ' - ' + bot.id);
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({'extended': 'true'}));
app.use(bodyParser.json());


app.post('/message', function (req, res) {
	var message = req.body.message;
    var channelID = req.body.channelID;
    var chance = Math.floor(Math.random() * 10);
    if (chance > 2) {
        message = "Fuck you.";
    }
	bot.sendMessage({
        to: channelID,
        message: message
    });
	res.sendStatus(200);
});

app.listen(port, function () {
	console.log("Server running on port " + port + ".");
});