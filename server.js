HELP_MSG = '<strong>commands:</strong><br/>' +
           '/login YOURNAME<br/>'            +
           '/join ROOM';
ROOM_REGEXP = /^[a-z0-9_\-]+$/i;
NAME_REGEXP = /^[a-z0-9_\-\s'"]+$/i;

var sys = require('sys');
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);

app.use(express.static(__dirname + '/public'));

app.set('view options', {layout: false});

app.get('/', function(req, res) {
  res.redirect('/lobby');
});

app.get('/:room', function(req, res) {
  if(req.params.room.match(ROOM_REGEXP)) {
    res.render('room.jade', {room: req.params.room});
  } else {
    res.send('Invalid room name.')
  }
});

app.listen(process.env.PORT || 8080);

io.sockets.on('connection', function (socket) {

  socket.on('connect', function() {
    socket.set('room', 'lobby');
    socket.join('lobby');
  });

  socket.on('join', function(room) {
    if(room.match(ROOM_REGEXP)) {
      socket.get('room', function(err, oldRoom) {
        socket.leave(oldRoom);
        socket.set('room', room);
        socket.join(room);
        socket.emit('message', {who: 'system', msg: 'Welcome to ' + room});
      });
    } else {
      socket.emit('message', {who: 'system', msg: 'Invalid room name.'});
    }
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
            if(name.match(NAME_REGEXP)) {
              socket.set('name', name);
              socket.get('room', function(err, room) {
                socket.emit('login', name);
                io.sockets.in(room).emit('message', {who: name, msg: '<em>logged in</em>'});
              });
            } else {
              socket.emit('message', {who: 'system', msg: 'Invalid name.'});
            }
          } else {
            resp = HELP_MSG;
          }
          break;
        case '/join':
          if(parts[1] && parts[1].match(ROOM_REGEXP)) {
            socket.emit('join', parts[1]);
          } else {
            socket.emit('message', {who: 'system', msg: 'Invalid room name.'});
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
          console.log('room:', socket);
          socket.get('room', function(err, room) {
            io.sockets.in(room).emit('message', message);
          });
        } else {
          socket.emit('message', {who: 'system', msg: 'first identify yourself with /login YOURNAME'});
        }
      });
    }
  });

  socket.on('disconnect', function () {
    socket.get('name', function(err, name) {
      if(name) {
        socket.get('room', function(err, room) {
          io.sockets.in(room).emit('message', {who: name, msg: "<em>logged out</em>"});
        });
      }
    })
  });
});
