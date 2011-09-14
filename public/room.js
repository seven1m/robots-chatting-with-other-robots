$(document).ready(function () {
  var lastBy;
  var odd = false;
  var baseUrl = location.href.match(/^https?:\/\/[^\/]+/)[0];
  var socket = io.connect(baseUrl);
  socket.on('connect', function () {
    socket.emit('join', location.href.match(/\/([^\/]+)$/)[1]);
  });
  socket.on('message', function (message) {
    var html;
    if(message.who != lastBy) {
      odd ^= true;
      var imgUrl = 'http://static1.robohash.com/' + encodeURIComponent(message.who);
      var avatar = '<a href="' + imgUrl + '"><img class="avatar" src="' + imgUrl + '"/></a>';
      var time = '<span class="timestamp">' + timestamp() + '</span>';
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

  $('input').keydown(function (event) {
    if(event.keyCode === 13) {
      var msg = $('input').val();
      var joinCmd = msg.match(/^\/join\s+([a-z0-9_\-]+)$/);
      if(joinCmd) {
        location.href = '/' + joinCmd[1];
      } else {
        socket.emit('message', {msg: msg});
      }
      $('input').val('');
    }
  })[0].focus();
});

function timestamp() {
  var t = new Date();
  return $.format.date(t, 'ddd hh:mm a');
};
