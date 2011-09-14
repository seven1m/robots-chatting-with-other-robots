HELP_MSG = '<strong>commands:</strong><br/>/login YOURNAME';

var sys = require('sys');
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);

app.use(express.static(__dirname + '/public'));

app.listen(process.env.PORT || 8080);

io.sockets.on('connection', function (socket) {
  socket.on('connect', function() {
    socket.emit({who: 'system', msg: "Welcome."});
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
            io.sockets.emit('message', {who: name, msg: '<em>logged in</em>'});
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
          io.sockets.emit('message', message);
        } else {
          socket.emit('message', {who: 'system', msg: 'first identify yourself with /login YOURNAME'});
        }
      });
    }
  });

  socket.on('disconnect', function () {
    socket.get('name', function(err, name) {
      if(name) {
        io.sockets.emit('message', {who: name, msg: "<em>logged out</em>"});
      }
    })
  });
});
