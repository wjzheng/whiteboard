var io = require('socket.io');
var sys = require("sys");
var fs = require("fs");
var mkdir = require("mkdirp");

exports.initWbMsgServer = function(app) {
  var userCount = 0, imageCount = 0;
  var onlineUsers = {};
  io = io.listen(app);
  io.sockets.on('connection', function(socket) {

    socket.on('nickname', function(nick, fn) {
      if (onlineUsers[nick]) {
        fn(true);
      } else {
        fn(false);
        onlineUsers[nick] = socket.nickname = nick;
        socket.broadcast.emit('conn', nick);
        io.sockets.emit('nicknames', onlineUsers);
      }
    });

    // listen client request
    socket.on('wb_client_msg', function(msg) {
      var nickname = this.nickname;
      socket.broadcast.emit('wb_server_msg', {
        data : msg,
        from : nickname
      })
    });

    // handle save image request
    socket.on('save_image', function(imageContent) {
      var nickname = this.nickname;
      var base64Data = imageContent.replace(/^data:image\/png;base64,/, "");
      var imageFolder = "./public/files/" + nickname + "/wb/";
      mkdir.sync(imageFolder, "0755");
      var imagePath = imageFolder + ++imageCount + ".png";
      var thumbnailPath = imageFolder + imageCount + "-small.png"
      fs.writeFile(imagePath, base64Data, 'base64', function(err) {
        if (!err) {
          var im = require('imagemagick');
          im.resize({
            srcPath : imagePath,
            dstPath : thumbnailPath,
            width : 110,
            height : 62
          }, function(err, stdout, stderr) {
            if (err) {
              socket.emit('save_img_response', {
                err : "resize image exception!"
              });
            } else {
              socket.emit('save_img_response', {
                thumbnailPath : "/files/" + nickname + "/wb/" + imageCount + "-small.png",
                imagePath : "/files/" + nickname + "/wb/" + imageCount + ".png"
              });
            }
          });
        } else {
          socket.emit('save_img_response', {
            err : "save image exception!"
          });
        }
      });
    });

    socket.on('disconnect', function() {
      var nickname = socket.nickname;
      // broadcast other client that user has left
      delete onlineUsers[nickname];
      socket.broadcast.emit('left', nickname);
      socket.broadcast.emit('nicknames', onlineUsers);
    });
  });
}