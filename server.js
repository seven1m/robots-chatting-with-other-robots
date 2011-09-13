MAX_MESSAGES = 25;
HELP_MSG = '<strong>commands:</strong><br/>/login YOURNAME';

var sys = require('sys');
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);

app.use(express.static(__dirname + '/public'));

app.listen(process.env.PORT || 8080);

var messages = [];

io.sockets.on('connection', function (socket) {
  messages.forEach(function(m) {
    socket.emit('message', m);
  });
  socket.on('leave', function (who) {
    io.sockets.emit('message', {who: who, msg: "left the room."});
  });
  socket.on('message', function (message) {
    if(message.msg.match(/^\//)) {
      var parts = message.msg.split(/\s+/);
      var cmd = parts[0]
      var resp;
      switch(cmd.toLowerCase()) {
        case '/help':
          resp = HELP_MSG;
          break;
        case '/login':
          if(parts[1]) {
            var name = message.msg.replace(/^\/login\s+/, '');
            socket.set('name', name);
            broadcastMessage({who: name, msg: '<em>logged in</em>'});
          } else {
            resp = HELP_MSG;
          }
          break;
        default:
          resp = 'unknown command; type /help'
      }
      if(resp) socket.emit('message', {who: 'system', msg: resp});
    } else {
      socket.get('name', function(err, name) {
        if(name) {
          message.who = name;
          broadcastMessage(message);
        } else {
          socket.emit('message', {who: 'system', msg: 'first identify yourself with /login YOURNAME'});
        }
      });
    }
  });
  socket.on('disconnect', function () {
    // nothing
  });
});

function broadcastMessage(message) {
  io.sockets.emit('message', message);
  messages.push(message)
  if(messages.length > MAX_MESSAGES) {
    messages = messages.slice(0, 1);
  }
}
