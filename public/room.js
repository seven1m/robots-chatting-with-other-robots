$(document).ready(function () {
  var lastBy;
  var baseUrl = location.href.match(/^https?:\/\/[^\/]+/)[0];
  var socket = io.connect(baseUrl);
  var me;

  socket.on('connect', function() {
    $('#messages').empty();
    socket.emit('join', location.href.match(/\/([^\/]+)$/)[1]);
    var name;
    if(name = $.cookie('name')) {
      socket.emit('message', {msg: '/login ' + name});
    }
  });

  socket.on('message', function(message) {
    printMessage(message, 'incoming');
  });

  socket.on('join', function(room) {
    location.href = '/' + room;
  });

  socket.on('login', function(name) {
    $.cookie('name', name);
    me = name;
  });

  $('input').keydown(function (event) {
    if(event.keyCode === 13) {
      var msg = $('input').val();
      if(!msg.match(/^\//)) {
        printMessage({who: me, msg: msg}, 'outgoing');
      }
      socket.emit('message', {msg: msg});
      $('input').val('');
    }
  })[0].focus();
});

var lastMessageBy, lastMessageTime, oddMessage;

function printMessage(message, sound) {
  var when = message.when ? new Date(message.when) : new Date();
  if(message.who != lastMessageBy || $.format.date(when, 'yyyyMMddHH') != $.format.date(lastMessageTime, 'yyyyMMddHH')) {
    oddMessage ^= true;
    var html;
    var imgUrl = 'http://static1.robohash.com/' + encodeURIComponent(message.who);
    var avatar = '<a href="' + imgUrl + '"><img class="avatar" src="' + imgUrl + '"/></a>';
    var time = '<span class="timestamp">' + $.format.date(when, 'ddd hh:mm a') + '</span>';
    var who = '<span class="who">' + message.who + '</span>';
    html = '<br clear="left"/><div class="details">' + avatar + time + '<br/>' + who + '</div><div class="content"><div class="bubble ' + (oddMessage ? 'odd' : 'even') + '">';
    $('#messages').append(html + message.msg + '</div></div>');

  } else {
    $('#messages .bubble:last').append('<br/>' + message.msg);
  }
  $(window).scrollTop($('#messages').attr('scrollHeight') + 100);
  $('#' + sound + 'Sound')[0].play();
  lastMessageBy = message.who;
  lastMessageTime = when;
}
