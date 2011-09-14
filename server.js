HELP_MSG = '<strong>commands:</strong><br/>' +
           '/login YOURNAME<br/>'            +
           '/join ROOM<br/>'                 +
           '/search TEXT<br/>'               +
           '/history';
ROOM_REGEXP = /^[a-z0-9_\-]+$/i;
NAME_REGEXP = /^[a-z0-9_\-\s'"]+$/i;
MAX_MESSAGE_COUNT = 100;

var sys = require('sys');
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);
var redis;
if(process.env.REDISTOGO_URL) {
  var rtg   = require('url').parse(process.env.REDISTOGO_URL);
  redis = require('redis').createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(':')[1]);
} else {
  redis = require('redis').createClient()
}

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
            var name = message.msg.replace(/^\/login\s+/i, '');
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
        case '/search':
          var query = message.msg.replace(/^\/search\s+/i, '');
          redis.lrange('messages', MAX_MESSAGE_COUNT*-1, -1, function(err, messages) {
            messages.forEach(function(message) {
              var message = JSON.parse(message);
              if(message.msg.indexOf(query) > -1) {
                socket.emit('message', message);
              }
            });
          });
          break;
        case '/history':
          redis.lrange('messages', MAX_MESSAGE_COUNT*-1, -1, function(err, messages) {
            messages.forEach(function(message) {
              socket.emit('message', JSON.parse(message));
            });
          });
          break;
        default:
          resp = 'unknown command; type /help'
      }
      if(resp) socket.emit('message', {who: 'system', msg: resp});
    } else if(message.msg.replace(/\s*/, '') != '') {
      socket.get('name', function(err, name) {
        if(name) {
          message.who = name;
          message.when = new Date();
          socket.get('room', function(err, room) {
            socket.broadcast.in(room).emit('message', message);
            redis.rpush('messages', JSON.stringify(message));
            redis.ltrim(MAX_MESSAGE_COUNT*-1, -1, function(err) {});
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
