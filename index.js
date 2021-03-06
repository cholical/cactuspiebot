var Discord = require('discord.io');
var request = require('request');
var sync = require('sync-request');
var fs = require('fs');
var _ = require('lodash');
var auth = require('./auth.json');
var botinfo = require('./botconfig.json');
var zerorpc = require("zerorpc");
var exec = require('child_process').exec;

var discordApi = 'https://discordapp.com/api/';

var dataStore = 'markovgen/corpora/';

var channels = ["220307845483069440", "110114161098248192"];
//var channels = ["110114161098248192"];

var childProcesses = [];

var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

var host = "127.0.0.1";
var port = 8000;
var client = new zerorpc.Client();
client.connect("tcp://" + host + ":" + port);

var pythonProcess;

bot.on('ready', function (event) {
    console.log('Connected');
    console.log('Logged in as: ');
    console.log(bot.username + ' - ' + bot.id);

    for (var key in botinfo) {
        if (!botinfo.hasOwnProperty(key)) continue;
        var botobj = botinfo[key];

        try {
            var cmd = 'node ' + botobj.script + ' ' + botobj.port;
            console.log(cmd);
            var childProcess = exec(cmd, function (err, stdout, stderr) {
                if (err) {
                    console.log(cmd);
                    console.log(err);
                }
            });
            childProcesses.push(childProcess);
            childProcess.stdout.pipe(process.stdout);
        } catch (err) {
            console.log(err);
        }
    }

    var pyCmd = 'python3 markovgen/server.py';
    pythonProcess = exec(pyCmd, function (err, stdout, stderr) {
        if (err) {
            console.log(cmd);
            console.log(err);
        }
    });

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
    //if message mentions a bot, query that bot and send result as message
    var mentionId = getMentionId(message);
    if (mentionId != ""){
        if (botinfo[mentionId] != undefined) {
            //query that bot
            client.invoke("readModel", botinfo[mentionId].modelUID, 1, function(error, res, more) {
                console.log(res);
                request.post('http://127.0.0.1:' + botinfo[mentionId].port  + '/message', {
                    form: {
                        channelID: channelID,
                        message: res[0]
                    }
                }, function (err, httpResponse, body) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        }
    }
    // hhandle normal commands
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        var modelUID = "71716577669550080"; //default to mac
        if (args[1] != undefined) {
            modelUID = getMentionId(args[1]);
            console.log("model id found", modelUID, args[1], message);
            if (botinfo[modelUID] != undefined){
                //need to map this id to an actual author id
                modelUID = botinfo[modelUID].modelUID;
            } // otherwise, this is directly mentioning an author
        }
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
                client.invoke("createModel", modelUID + ".txt", modelUID, function(error, res, more) {
                    console.log(res);
                    bot.sendMessage({
                        to: channelID,
                        message: 'Model ' + modelUID + ' created.'
                    });
                });

                break;
            case 'query':
                client.invoke("readModel", modelUID, 1, function(error, res, more) {
                    console.log(res);
                    request.post('http://127.0.0.1:' + getBot(modelUID).port  + '/message', {
                        form: {
                            channelID: channelID,
                            message: res[0]
                        }
                    }, function (err, httpResponse, body) {
                        if (err) {
                            console.log(err);
                        }
                    });
                });
                break;
        }
    }
});

function fetchText(options,channels){

    var messages = [];
    var lastMsgId;
    var writers = {};
    var authors = [];
    var firstTime = true;
    var latestMessages = require('./latest.json'); // { channel: latest message id}

    var counter = 0;
    for (var i = 0; i < channels.length; i++) {
        options.url = discordApi + 'channels/' + channels[i] + '/messages?after=' + latestMessages[channels[i]] + '&limit=100';
        //options.url = discordApi + 'channels/' + channels[i] + '/messages?limit=100';
        console.log(options.url);
        while (true) {
            var res = sync('get', options.url, options);
            messages = JSON.parse(res.getBody().toString());
            counter += messages.length;
            console.log("GET " + messages.length + " messages: " + counter + "!");

            _.forEachRight(messages, function (message) {
                // messages are in newset to oldest, so we reverse the loop to put oldest at the beginning of the file
                if (writers[message.author.id] == undefined) {
                    writers[message.author.id] = fs.openSync(dataStore + message.author.id + '.txt', 'w');
                    authors.push(message.author)
                }
                //split current line on sentences based on punctuation followed by at least one space
                var lines = message.content.replace(/([.?!])\s+(?=[a-zA-Z\d])/g, "$1|").split("|")
                _.forEachRight(lines, function(line){
                    //for each sentence, write it as a new line
                    fs.writeSync(writers[message.author.id], line + '\n');
                });
            });

            if (messages.length > 0) {
                lastMsgId = messages[0].id;
                //options.url = discordApi + 'channels/' + channels[i] + '/messages?before=' + messages[messages.length - 1].id + '&limit=100';
                options.url = discordApi + 'channels/' + channels[i] + '/messages?after=' + lastMsgId + '&limit=100';
            } else {
                latestMessages[channels[i]] = lastMsgId;
                break;
            }
        }
    }

    if (!isEmptyObject(latestMessages)){
        fp = fs.openSync('latest.json', 'w');
        fs.writeSync(fp, JSON.stringify(latestMessages));
    }

    for (var property in writers) {
        if (writers.hasOwnProperty(property)) {
            fs.closeSync(writers[property]);
        }
    }

    console.log("Author map")
    _.forEach(authors, function(author) {
        console.log(author.id, author.username)
    });


}

function getMentionId(string){
    //get first mention
    var regex = /<@!?(\d+)>/g;
    var match = regex.exec(string);
    var mentionId = "";
    if (match != null) {
        mentionId = match[1];
    }
    return mentionId;
}

function getBot(modelUID) {
    for (var key in botinfo) {
        if (!botinfo.hasOwnProperty(key)) continue;
        var botobj = botinfo[key];
        if (botobj.modelUID == modelUID) {
            return botobj
        }
    }
    return null
}
function isEmptyObject(obj) {
    for(var prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            return false;
        }
    }
    return true;
}
process.on('exit', function () {
    console.log('Killing all child processes');
    for (var i = 0; i < childProcesses.length; i++) {
        childProcesses[i].kill();
    }
    pythonProcess.kill();
});
