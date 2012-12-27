var sys = require("sys");
var fs = require("fs");
var mkdir = require("mkdirp");

exports.initWbMsgServer = function(io) {
  var userCount = 0, imageCount = 0;
  var onlineUsers = {};
  io.sockets.on('connection', function(socket) {

    socket.on("conn", function(username) {
      onlineUsers[username] = socket.username = username;
      io.sockets.emit('onlineusers', onlineUsers);
      socket.broadcast.emit('announcement', username + " online.");
    });
    // listen client request
    socket.on('wb_client_msg', function(msg) {
      var username = this.username;
      socket.broadcast.emit('wb_server_msg', {
        data : msg,
        from : username
      })
    });

    // handle save image request
    socket.on('save_image', function(imageContent, callbackFN) {
      var username = this.username;
      var base64Data = imageContent.replace(/^data:image\/png;base64,/, "");
      var imageFolder = "./public/files/" + username + "/wb/";
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
            callbackFN(err, {
              imageId : imageCount,
              thumbnailPath : "/files/" + username + "/wb/" + imageCount + "-small.png"
            })
          });
        } else {
          callbackFN("save image exception!");
        }
      });
    });

    socket.on('disconnect', function() {
      var username = socket.username;
      // broadcast other client that user has left
      delete onlineUsers[username];
      socket.broadcast.emit('announcement', username + " offline.");
      socket.broadcast.emit('onlineusers', onlineUsers);
    });
  });
}