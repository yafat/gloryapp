var readline = require('readline');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var net = require('net');
var client = new net.Socket();
var is_connected = false;
var retry = 0;
app.use(express.static('www'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/www/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.broadcast.emit('hi');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('cmd', function(cmd){
    console.log('rec cmd='+cmd);
    if(cmd == 'get_pic' || cmd == 'select_type=1' || cmd == 'select_type=2' || cmd == 'select_type=3'){
      swrite(cmd);
    }
  });
});


http.listen(3000, function(){
  console.log('Start listening on *:3000');
});
try{
  client.connect(8889, '127.0.0.1', function() {
    console.log('Server Connected');
    is_connected = true;
  });

  client.on('data', function(data) {
    console.log('Received: ' + data);
    if(data.toString().substring(0, 10) == 'get_pic_ok'){
      console.log('Receive get_pic_ok, transfer to App');
      io.emit('cmd', 'get_pic_ok');
    }else if(data.toString().substring(0, 4) == 'step'){
      console.log('Receive '+ data.toString().substring(0, 5) + ', transfer to App');
      io.emit('cmd', data.toString().substring(0, 5));
    }else if(data.toString().substring(0, 15) == 'makeup_complete'){
      console.log('Receive makeup_complete, transfer to App');
      io.emit('cmd', 'makeup_complete');
    }else{
      var msg = data.toString();
      proc_robot_msg(msg);
    }
  });
  client.on('error', function(err) {
    if (err.code == "ENOTFOUND") {
      console.log("[ERROR] No device found at this address!");
      io.emit('msg', '化妝機連線錯誤');
      setTimeout(reConnectSocket, 3000);
      return;
    }
    if (err.code == "ECONNREFUSED") {
      console.log("[ERROR] Connection refused! Please check the IP.");
      io.emit('msg', '化妝機連線失敗');
      setTimeout(reConnectSocket, 3000);
      return;
    }
  });
  client.on('close', function() {
    if(retry == 0) io.emit('msg', '化妝機連線停止');
    console.log('Connection closed');
    setTimeout(reConnectSocket, 3000);
  });
}catch(e){
  console.log('Connection Failed');
  setTimeout(reConnectSocket, 3000);
}
function reConnectSocket(){
  retry++;
  if(is_connected) return false;
  if(retry > 10){
    io.emit('msg', '無法連線到化妝機，請稍候再試，若持續無法連線，請重新開機！');
    console.log('Connection retry terminated.');
    return false;
  }
  console.log('Start Connect to localhost...');
  client.connect(8889, '127.0.0.1', function() {
    console.log('Server Connected');
    is_connected = true;
  });
}
function swrite(cmd){
  console.log('Send Socket cmd:'+cmd);
  if(is_connected === true){
      client.write(cmd + '\n');
    }else{
      console.log('Can not send cmd:'+cmd+', Socket is not connected.');
    }
}
function proc_robot_msg(msg){
  if(msg.substring(0, 11).toLowerCase() == 'robot_error'){
    console.log('Receive Robot Error, transfer to App');
    io.emit('msg', '化妝機機械出現異常，請重新啟動化妝機！');
  }else if(msg.substring(0, 8).toLowerCase() == 'robot_ok'){
    console.log('Receive Robot Ok, transfer to App');
    io.emit('msg', '化妝機機械正常。');
  }else if(msg.substring(0, 9).toLowerCase() == 'cam_error'){
    console.log('Receive Cam Error, transfer to App');
    io.emit('msg', '3D相機出現異常，請重新啟動化妝機！');
  }else if(msg.substring(0, 6).toLowerCase() == 'cam_ok'){
    console.log('Receive Cam Ok, transfer to App');
    io.emit('msg', '3D相機正常。');
  }else if(msg.substring(0, 9).toLowerCase() == 'ink_error'){
    console.log('Receive Ink Error, transfer to App');
    io.emit('msg', '色匣色號無法辨識或安裝錯誤，請重新安裝！');
  }else if(msg.substring(0, 6).toLowerCase() == 'ink_ok'){
    console.log('Receive Cam Ok, transfer to App');
    io.emit('msg', '色匣正常。');
  }else if(msg.substring(0, 7).toLowerCase() == 'ink_low_ok'){
    console.log('Receive Ink Low Ok, transfer to App');
    io.emit('msg', '色匣墨量正常。');
  }else if(msg.substring(0, 8).toLowerCase() == 'ink_low='){
    var wrong_inks = msg.substring(8);
    console.log('Receive Ink Low Error at '+wrong_inks+', transfer to App');
    io.emit('msg', '色匣編號：'+wrong_inks+'低墨量，請更換新色匣。');
  }else{
    console.log('Receive unknown message, transfer to App');
    io.emit('msg', '化妝機訊息：'+msg);
  }
}
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', function (cmd) {
  console.log('send command: '+cmd);
  if(cmd == 'send_socket'){
    rl.question("Input the command to send to Socket ", function(data) {
        swrite(data);
    });
  }else if(cmd == 'send_msg'){
    rl.question("Input the message to send to App ", function(data) {
        io.emit('msg', data);
    });
  }else if(cmd == 'send_cmd'){
    rl.question("Input the command to send to App ", function(data) {
        io.emit('cmd', data);
    });
  }
});