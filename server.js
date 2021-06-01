var PORT = 3000;
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var moment = require('moment');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret:'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  cookie:{maxAge:60*1000}
}))
app.set('views', path.join(__dirname, 'views'));
var connectionList = {};
var uuIdList = [];  
var firendList=[];

const uuid = function () {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4";  
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); 
  s[8] = s[13] = s[18] = s[23] = "-";

  var uuid = s.join("");
  return uuid;
}

app.get('/addMeeting', function (req, res) {
  let meetName = req.query.meetName;
  let ownerName = req.query.ownerName;
  if (!meetName) {
    res.json({ status: 2, msg: "参数不正确" });
  }

  let flag = false;
  uuIdList.map((item, index) => {
    if (item.meetName === meetName) {
      let params = {};
      params['meetName'] = meetName;
      params['uuid'] = item.uuid;
      flag = true;
      res.json({ status: 0, msg: "该会议已创建,不用再次创建", data: params });
    }
  });

  if (!flag) {
    let params = {};
    params['meetName'] = meetName;
    params['uuid'] = uuid();
    uuIdList.push(params);
    res.json({ status: 1, data: params });
  }
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/newmeeting.html');
});

app.get('/chat', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/uidcheck', function (req, res) {
  let flag = 0;
  uuIdList.map((item, index) => {
    if (item.uuid === req.query.uuid) {
      flag = true;
    }
  })
  if (!flag) {
    res.json({ status: 0, msg: "您的会议账号不正确" });
  } else {
    res.json({ status: 1, msg: "" });
  }
});

app.get('/login', function (req, res) {


  if(req.session.isLogin){
    console.log(req.session.username);
    var flag = false;
    firendList.map((item,_index)=>{
      if(item.username === req.session.username){
        flag = true;
      }
    })
    if(!flag){
      res.redirect("http://localhost:3000/chat?uuid=" +req.query.uuid +"&name=" +req.session.username);
    }else{
      res.sendFile(__dirname + '/views/loginError.html');
    }
  }
  else{
    res.sendFile(__dirname + '/views/login.html');
  }
});
app.get('/loginStorage', function (req, res) {
  var name = req.query.name;
  req.session.username = name;
  req.session.isLogin = true;
  res.json({status:1,msg:"ok"});
});

app.get('/404', function (req, res) {
  res.sendFile(__dirname + '/views/404.html');
});

io.on('connection', function (socket) {
  var socketId = socket.id;
  connectionList[socketId] = {
    socket: socket
  };

  socket.on("join", function (obj) {
    var date = new Date();
    io.emit("join", { name: obj.name,uuid:obj.uuid, date: moment().format("YYYY-MM-DD HH:mm:ss") });
    connectionList[socketId].username = obj.name;
    connectionList[socketId].uuid = obj.uuid;
    firendList.push({username:connectionList[socketId].username, socketId:socketId,uuid:obj.uuid})
    io.emit('getUserList', {
      firendList:firendList
    });
  });

  socket.on('disconnect', function () {
    let index=0;
    if (connectionList[socketId].username) {
      socket.broadcast.emit('broadcast_quit', {
        username: connectionList[socketId].username,
        uuid:connectionList[socketId].uuid,
      });
      firendList.map((item,_index)=>{
        if(item.socketId==socketId){
           index=_index;
        }
      })
      firendList.splice(index, 1);
      io.emit('getUserList', {
        firendList:firendList
      });
    }
    delete connectionList[socketId];
  });
  socket.on("message", function (msg) {
    msg.time=moment().format("YYYY-MM-DD HH:mm:ss");
    console.log(msg);
    io.emit("message", msg)
  })
});

http.listen(PORT, function () {
  console.log('listening on *:'+PORT);
});