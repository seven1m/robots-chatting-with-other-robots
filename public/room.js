$(document).ready(function () {
  var lastBy;
  var odd = false;
  var baseUrl = location.href.match(/^https?:\/\/[^\/]+/)[0];
  var socket = io.connect(baseUrl);

  socket.on('connect', function() {
    socket.emit('join', location.href.match(/\/([^\/]+)$/)[1]);
    var name;
    if(name = $.cookie('name')) {
      socket.emit('message', {msg: '/login ' + name});
    }
  });

  socket.on('message', function(message) {
    var html;
    if(message.who != lastBy) {
      odd ^= true;
      var imgUrl = 'http://static1.robohash.com/' + encodeURIComponent(message.who);
      var avatar = '<a href="' + imgUrl + '"><img class="avatar" src="' + imgUrl + '"/></a>';
      var time = '<span class="timestamp">' + $.format.date(new Date(), 'ddd hh:mm a') + '</span>';
      var who = '<span class="who">' + message.who + '</span>';
      html = '<br clear="left"/><div class="details ' + (odd ? 'odd' : 'even') + '">' + avatar + time + '<br/>' + who + '</div><div class="content push-down ' + (odd ? 'odd' : 'even') + '">';
    } else {
      html = '<div class="content ' + (odd ? 'odd' : 'even') + '">';
    }
    $('#messages').append(
      html + message.msg + '</div>'
    ).scrollTop(
      $("#messages").attr("scrollHeight") + 100
    );
    lastBy = message.who;
  });

  socket.on('join', function(room) {
    location.href = '/' + room;
  });

  socket.on('login', function(name) {
    $.cookie('name', name);
  });

  $('input').keydown(function (event) {
    if(event.keyCode === 13) {
      socket.emit('message', {msg: $('input').val()});
      $('input').val('');
    }
  })[0].focus();
});
