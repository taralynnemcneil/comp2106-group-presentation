var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
// initialize a new instance of socket.io by passing the http (the HTTP server) object
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

// serving html
app.get('/', function (req, res) {
    res.sendfile('index.html');
});

var connectedSockets={};
var allUsers=[{nickname:"",color:"#000"}]; //初始值即包含"群聊",用""表示nickname
io.on('connection',function(socket){


    socket.on('addUser',function(data){ // New user enters chat room
        if(connectedSockets[data.nickname]){// nickname is taken
          socket.emit('userAddingResult',{result:false});
        }else{
            socket.emit('userAddingResult',{result:true});
            socket.nickname=data.nickname;
            // save each socket instance, will use when send direct message
            connectedSockets[socket.nickname]=socket;//保存每个socket实例,发私信需要用  
            allUsers.push(data);
            // broadcast welcome message, visible to all users except newly entered user
            socket.broadcast.emit('userAdded',data);//广播欢迎新用户,除新用户外都可看到
            // send all online user to new user
            socket.emit('allUser',allUsers);//将所有在线用户发给新用户
        }

    });

    // send message
    socket.on('addMessage',function(data){ //有用户发送新消息
        // send direct message to a user
        if(data.to){//发给特定用户
            connectedSockets[data.to].emit('messageAdded',data);
        }else{//群发 send group message
            // broadcast message, visible to all users except sender
            socket.broadcast.emit('messageAdded',data);//广播消息,除原发送者外都可看到
        }

    });


    // user leaves chat room
    socket.on('disconnect', function () {  //有用户退出聊天室
            // broadcast message that a user left
            socket.broadcast.emit('userRemoved', {  //广播有用户退出
                nickname: socket.nickname
            });
            // remove user from users data
            for(var i=0;i<allUsers.length;i++){
                if(allUsers[i].nickname==socket.nickname){
                    allUsers.splice(i,1);
                }
            }
            // remove corresponding socket instance from data that contains all client side socket instances
            delete connectedSockets[socket.nickname]; //删除对应的socket实例

        }
    );
});

// listen on the connection event for incoming sockets, log it to the console.
http.listen(3002, function () {
    console.log('listening on *:3002');
});