(function() {
  window.wbMsgClient = {

    socket : null,

    remoteUserPosition : {},

    remoteUserLineWidth : {},

    remoteUserColor : {},

    remoteIsEraser : {},

    init : function(socket) {
      var that = this;
      this.socket = socket;
      this.socket.on('conn', function(nickname) {
        $("#sys_msg").html(nickname + " has online!");
      });
      this.socket.on('left', function(nickname) {
        console.log(nickname);
        $("#sys_msg").html(nickname + " has offline!");
      });
      this.socket.on('nicknames', function(onlineUsers) {
        $('#online_users').empty().append($('<span>Online: </span>'));
        for ( var user in onlineUsers) {
          $('#online_users').append($('<span class="online_user"></span>').text(onlineUsers[user]));
        }
      });
      this.socket.on('wb_server_msg', function(data) {
        that.handleMsg(data.from, data.data);
      });
      this.socket.on('save_img_response', function(data) {
        if (!data.err) {
          var filePath = data.imagePath;
          var thumbnailPath = data.thumbnailPath;
          var imageNode = $("<div class='imageItem'><img src='" + data.thumbnailPath + "'/></div>");
          imageNode.data("filePath", filePath);
          $("#wb_images").append(imageNode);
        } else {
          // show err msg
        }
      });
    },

    // send requests to serverside
    sendRequest : function(req) {
      if (req.isRemote) {
        return;
      }
      this.socket.emit('wb_client_msg', req);
    },

    // handle response from server side
    handleMsg : function(from, data) {
      var responses = this._decodeMsg(data);
      for ( var i = 0, len = responses.length; i < len; i++) {
        var remoteRequest = responses[i];
        remoteRequest.isRemote = true;
        remoteRequest.from = from;
        var cmd = remoteRequest.cmd;
        switch (cmd) {
        case wbRequests.CMD.BEGIN_DRAW:
          this.remoteUserPosition[from] = {
            startX : remoteRequest.startX,
            startY : remoteRequest.startY
          }
          if (this.remoteUserLineWidth[from] === undefined) {
            this.remoteUserLineWidth[from] = wb.options.lineWidth;
          }
          if (this.remoteUserColor[from] === undefined) {
            this.remoteUserColor[from] = wb.options.color;
          }
          this.remoteIsEraser[from] = remoteRequest.isEraser;
          wbProcessor.createTmpCanvas(from);
          wbUndoManager.saveState();
          break;
        case wbRequests.CMD.DRAWING:
          var remoteuserPosition = this.remoteUserPosition;
          if (remoteuserPosition[from] === undefined) {
            remoteRequest.startX = remoteRequest.lineToX;
            remoteRequest.startY = remoteRequest.lineToY;
          } else {
            remoteRequest.startX = remoteuserPosition[from].startX;
            remoteRequest.startY = remoteuserPosition[from].startY;
          }
          if (this.remoteIsEraser[from]) {
            remoteRequest.color = wb.options.backgroundColor;
            remoteRequest.lineWidth = wb.options.eraserSize;
          } else {
            remoteRequest.color = this.remoteUserColor[from] ? this.remoteUserColor[from] : remoteRequest.color;
            remoteRequest.lineWidth = this.remoteUserLineWidth[from] ? this.remoteUserLineWidth[from] : remoteRequest.lineWidth;
          }
          wbProcessor.drawing(remoteRequest);
          remoteuserPosition[from].startX = remoteRequest.lineToX;
          remoteuserPosition[from].startY = remoteRequest.lineToY;
          break;
        case wbRequests.CMD.SET_COLOR:
          this.remoteUserColor[from] = remoteRequest.color;
          break;
        case wbRequests.CMD.SET_LINE_WIDTH:
          this.remoteUserLineWidth[from] = remoteRequest.lineWidth;
          break;
        case wbRequests.CMD.BEGIN_DRAW_LINE:
          this.remoteUserPosition[from] = {
            startX : remoteRequest.startX,
            startY : remoteRequest.startY
          }
          wbProcessor.createRemoteCanvas(from);
          wbUndoManager.saveState();
          break;
        case wbRequests.CMD.DRAWING_LINE:
          var remoteuserPosition = this.remoteUserPosition;
          if (remoteuserPosition[from] === undefined) {
            remoteRequest.startX = remoteRequest.lineToX;
            remoteRequest.startY = remoteRequest.lineToY;
          } else {
            remoteRequest.startX = remoteuserPosition[from].startX;
            remoteRequest.startY = remoteuserPosition[from].startY;
          }
          remoteRequest.color = this.remoteUserColor[from] ? this.remoteUserColor[from] : remoteRequest.color;
          remoteRequest.lineWidth = this.remoteUserLineWidth[from] ? this.remoteUserLineWidth[from] : remoteRequest.lineWidth;
          wbProcessor.drawLine(remoteRequest);
          break;
        case wbRequests.CMD.BEGIN_DRAW_OVAL:
        case wbRequests.CMD.BEGIN_DRAW_RECT:
          this.remoteUserPosition[from] = {
            startX : remoteRequest.startX,
            startY : remoteRequest.startY,
            isFilled : remoteRequest.isFilled
          }
          if (this.remoteUserLineWidth[from] === undefined) {
            this.remoteUserLineWidth[from] = wb.options.lineWidth;
          }
          if (this.remoteUserColor[from] === undefined) {
            this.remoteUserColor[from] = wb.options.color;
          }
          wbProcessor.createRemoteCanvas(from);
          wbUndoManager.saveState();
          break;
        case wbRequests.CMD.DRAWING_OVAL:
          var remoteuserPosition = this.remoteUserPosition;
          remoteRequest.startX = remoteuserPosition[from].startX;
          remoteRequest.startY = remoteuserPosition[from].startY;
          remoteRequest.isFilled = remoteuserPosition[from].isFilled;
          remoteRequest.color = this.remoteUserColor[from] ? this.remoteUserColor[from] : remoteRequest.color;
          remoteRequest.lineWidth = this.remoteUserLineWidth[from] ? this.remoteUserLineWidth[from] : remoteRequest.lineWidth;
          wbProcessor.drawOval(remoteRequest);
          break;
        case wbRequests.CMD.DRAWING_RECT:
          var remoteuserPosition = this.remoteUserPosition;
          remoteRequest.startX = remoteuserPosition[from].startX;
          remoteRequest.startY = remoteuserPosition[from].startY;
          remoteRequest.isFilled = remoteuserPosition[from].isFilled;
          remoteRequest.color = this.remoteUserColor[from] ? this.remoteUserColor[from] : remoteRequest.color;
          remoteRequest.lineWidth = this.remoteUserLineWidth[from] ? this.remoteUserLineWidth[from] : remoteRequest.lineWidth;
          wbProcessor.drawRectangle(remoteRequest);
          break;
        case wbRequests.CMD.CLEAR:
          wbProcessor.clear(remoteRequest);
          break;
        case wbRequests.CMD.UNDO:
          wbProcessor.undo(remoteRequest);
          break;
        case wbRequests.CMD.REDO:
          wbProcessor.redo(remoteRequest);
          break;
        case wbRequests.CMD.DRAW_IMG:
          wbUndoManager.saveState();
          var imgSrc = remoteRequest.image;
          var image = new Image();
          image.onload = function() {
            remoteRequest.image = image;
            wbProcessor.drawImg(remoteRequest);
          }
          image.src = imgSrc;
          break;
        case wbRequests.CMD.MOVE_IMG:
          wbProcessor.moveImage(remoteRequest);
          break;
        case wbRequests.CMD.DRAW_TEXT:
          wbUndoManager.saveState();
          wbProcessor.drawText(remoteRequest);
          break;
        case wbRequests.CMD.END_DRAW:
          wbProcessor.endDraw(remoteRequest);
          break;
        }
      }
    },

    _decodeMsg : function(data) {
      var ret = [];
      var cmd = data.cmd, body = data.body;
      if (cmd === wbRequests.CMD.MOVING) {
        cmd = data.type;
      }
      switch (cmd) {
      case wbRequests.CMD.BEGIN_DRAW:
        ret.push(new wbRequests.BeginDrawRequest(parseInt(data.startX), parseInt(data.startY), data.isEraser));
        break;
      case wbRequests.CMD.SET_COLOR:
        ret.push(new wbRequests.SetColorRequest(data.color));
        break;
      case wbRequests.CMD.SET_LINE_WIDTH:
        ret.push(new wbRequests.SetLineWidthRequest(parseInt(data.lineWidth)));
        break;
      case wbRequests.CMD.DRAWING:
        var positions = body.split(",");
        for ( var i = 0, len = positions.length; i < len; i += 2) {
          ret.push(new wbRequests.DrawingRequest(null, null, parseInt(positions[i]), parseInt(positions[i + 1])));
        }
        break;
      case wbRequests.CMD.BEGIN_DRAW_LINE:
        ret.push(new wbRequests.BeginDrawLineRequest(parseInt(data.startX), parseInt(data.startY)));
        break;
      case wbRequests.CMD.DRAWING_LINE:
        var positions = body.split(",");
        for ( var i = 0, len = positions.length; i < len; i += 2) {
          ret.push(new wbRequests.DrawingLineRequest(null, null, parseInt(positions[i]), parseInt(positions[i + 1])));
        }
        break;
      case wbRequests.CMD.BEGIN_DRAW_RECT:
        var isFilled = data.isFilled;
        ret.push(new wbRequests.BeginDrawRectRequest(parseInt(data.startX), parseInt(data.startY), isFilled));
        break;
      case wbRequests.CMD.DRAWING_RECT:
        var positions = body.split(",");
        var isFilled = data.isFilled;
        for ( var i = 0, len = positions.length; i < len; i += 2) {
          ret.push(new wbRequests.DrawingRectRequest(null, null, parseInt(positions[i]), parseInt(positions[i + 1]), isFilled));
        }
        break;
      case wbRequests.CMD.BEGIN_DRAW_OVAL:
        var isFilled = data.isFilled;
        ret.push(new wbRequests.BeginDrawOvalRequest(parseInt(data.startX), parseInt(data.startY), isFilled));
        break;
      case wbRequests.CMD.DRAWING_OVAL:
        var positions = body.split(",");
        var isFilled = data.isFilled;
        for ( var i = 0, len = positions.length; i < len; i += 2) {
          ret.push(new wbRequests.DrawingOvalRequest(null, null, parseInt(positions[i]), parseInt(positions[i + 1]), isFilled));
        }
        break;
      case wbRequests.CMD.DRAW_IMG:
        ret.push(new wbRequests.DrawImageRequest(body));
        break;
      case wbRequests.CMD.MOVE_IMG:
        var p = body.split(",");
        ret.push(new wbRequests.MoveImageRequest(parseInt(p[0]), parseInt(p[1]), parseInt(p[2]), parseInt(p[3])));
        break;
      case wbRequests.CMD.DRAW_TEXT:
        var text = data.text;
        var startX = data.startX;
        var startY = data.startY;
        var fontSize = data.fontSize;
        var fontFamily = data.fontFamily;
        var isBold = data.isBold;
        var isItalic = data.isItalic;
        var isUnderLine = data.isUnderLine;
        var color = data.color;
        ret.push(new wbRequests.DrawTextRequest(startX, startY, text, fontSize, fontFamily, isItalic, isBold, isUnderLine, color));
        break;
      case wbRequests.CMD.CLEAR:
        ret.push(new wbRequests.ClearRequest());
        break;
      case wbRequests.CMD.UNDO:
        ret.push(new wbRequests.UndoRequest());
        break;
      case wbRequests.CMD.REDO:
        ret.push(new wbRequests.RedoRequest());
        break;
      case wbRequests.CMD.END_DRAW:
        ret.push(new wbRequests.EndDrawRequest());
        break;
      }
      return ret;
    },

    saveImage : function(imageContent) {
      this.socket.emit('save_image', imageContent.src);
    }
  };
})();