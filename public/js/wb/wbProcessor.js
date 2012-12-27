(function() {
  var hasTouch = 'ontouchstart' in window;
  // constants
  var PENCIL_ACTIVE = "pencil_active", BTN_CURVE = "btn_curve",
  // CSS
  BTN_SELECTED = "wb_btn_selected", RECTANGLE_ACTIVE = "rectangle_active", OVAL_ACTIVE = "oval_active", ERASER_ACTIVE = "eraser_active", MOVE_IMG = "move_image",
  // event
  EVT_START = hasTouch ? "touchstart" : "mousedown", EVT_MOVE = hasTouch ? "touchmove" : "mousemove", EVT_END = hasTouch ? "touchend" : "mouseup";
  EVT_KEYDOWN = "keydown";

  window.wbRequests = {

    CMD : {
      BEGIN_DRAW : "beginDraw",
      DRAWING : "drawing",
      SET_COLOR : "setColor",
      SET_LINE_WIDTH : "setLineWidth",
      BEGIN_DRAW_LINE : "beginDrawLine",
      DRAWING_LINE : "drawingLine",
      BEGIN_DRAW_RECT : "beginDrawRect",
      DRAWING_RECT : "drawingRect",
      BEGIN_DRAW_OVAL : "beginDrawOval",
      DRAWING_OVAL : "drawingOval",
      CLEAR : "clear",
      DRAW_IMG : "drawImg",
      MOVE_IMG : "moveImg",
      DRAW_TEXT : "drawText",
      MOVING : "moving",
      UNDO : "undo",
      REDO : "redo",
      END_DRAW : "endDraw"
    },

    BeginDrawRequest : function(startX, startY, isEraser) {
      this.cmd = wbRequests.CMD.BEGIN_DRAW;
      this.startX = startX;
      this.startY = startY;
      this.isEraser = isEraser;
    },

    DrawingRequest : function(startX, startY, lineToX, lineToY, color, lineWidth) {
      this.cmd = wbRequests.CMD.DRAWING;
      this.startX = startX;
      this.startY = startY;
      this.lineToX = lineToX;
      this.lineToY = lineToY;
      this.color = color || wbProcessor.color;
      this.lineWidth = lineWidth || wbProcessor.lineWidth;
    },

    SetColorRequest : function(color) {
      this.cmd = wbRequests.CMD.SET_COLOR;
      this.color = color;
    },

    SetLineWidthRequest : function(lineWidth) {
      this.cmd = wbRequests.CMD.SET_LINE_WIDTH;
      this.lineWidth = lineWidth;
    },

    BeginDrawLineRequest : function(startX, startY) {
      this.cmd = wbRequests.CMD.BEGIN_DRAW_LINE;
      this.startX = startX;
      this.startY = startY;
    },

    DrawingLineRequest : function(startX, startY, lineToX, lineToY, lineWidth, color) {
      this.cmd = wbRequests.CMD.DRAWING_LINE;
      this.startX = startX;
      this.startY = startY;
      this.lineToX = lineToX;
      this.lineToY = lineToY;
      this.lineWidth = lineWidth || wbProcessor.lineWidth;
      this.color = color || wbProcessor.color;
    },

    BeginDrawRectRequest : function(startX, startY, isFilled) {
      this.cmd = wbRequests.CMD.BEGIN_DRAW_RECT;
      this.startX = startX;
      this.startY = startY;
      this.isFilled = isFilled;
    },

    DrawingRectRequest : function(startX, startY, moveToX, moveToY, isFilled, lineWidth, color) {
      this.cmd = wbRequests.CMD.DRAWING_RECT;
      this.startX = startX;
      this.startY = startY;
      this.moveToX = moveToX;
      this.moveToY = moveToY;
      this.isFilled = isFilled;
      this.lineWidth = lineWidth || wbProcessor.lineWidth;
      this.color = color || wbProcessor.color;
    },

    BeginDrawOvalRequest : function(startX, startY, isFilled) {
      this.cmd = wbRequests.CMD.BEGIN_DRAW_OVAL;
      this.startX = startX;
      this.startY = startY;
      this.isFilled = isFilled;
    },

    DrawingOvalRequest : function(startX, startY, width, height, isFilled, lineWidth, color) {
      this.cmd = wbRequests.CMD.DRAWING_OVAL;
      this.startX = startX;
      this.startY = startY;
      this.width = width;
      this.height = height;
      this.isFilled = isFilled;
      this.lineWidth = lineWidth || wbProcessor.lineWidth;
      this.color = color || wbProcessor.color;
    },

    DrawImageRequest : function(imageSrc) {
      this.cmd = wbRequests.CMD.DRAW_IMG;
      this.imageSrc = imageSrc;
    },

    MoveImageRequest : function(mousePrevX, mousePrevY, mouseX, mouseY) {
      this.cmd = wbRequests.CMD.MOVE_IMG;
      this.mousePrevX = mousePrevX;
      this.mousePrevY = mousePrevY;
      this.mouseX = mouseX;
      this.mouseY = mouseY;
    },

    DrawTextRequest : function(startX, startY, text, fontSize, fontFamily, isItalic, isBold, isUnderLine, color) {
      this.cmd = wbRequests.CMD.DRAW_TEXT;
      this.startX = startX;
      this.startY = startY;
      this.text = text;
      this.fontSize = fontSize;
      this.fontFamily = fontFamily;
      this.isItalic = isItalic;
      this.isBold = isBold;
      this.isUnderLine = isUnderLine;
      this.color = color || wbProcessor.color;
    },

    ClearRequest : function() {
      this.cmd = wbRequests.CMD.CLEAR;
    },

    OrbitRequest : function(type, orbit) {
      this.cmd = wbRequests.CMD.MOVING;
      this.type = type;
      this.body = orbit;
    },

    UndoRequest : function() {
      this.cmd = wbRequests.CMD.UNDO;
    },

    RedoRequest : function() {
      this.cmd = wbRequests.CMD.REDO;
    },

    EndDrawRequest : function() {
      this.cmd = wbRequests.CMD.END_DRAW;
    }
  };

  window.wbProcessor = {

    requestQueue : [],

    remoteCanvas : {},

    tmpCanvas : {},

    currentImage : null,

    init : function() {
      this.lineWidth = wb.options.lineWidth;
      this.color = wb.options.color;
      this.currentCmd = null;

      this.canvas_O = TCC.find("#canvas_o").get(0);
      this.context_O = this.canvas_O.getContext("2d");
      this.context_O.lineWidth = this.lineWidth;
      this.context_O.lineCap = "round";
      this.context_O.strokeStyle = this.color;

      this.canvas = TCC.find("#canvas_t").get(0);
      this.context = this.canvas.getContext("2d");

      this.context.lineWidth = this.lineWidth;
      this.context.lineCap = "round";
      this.context.strokeStyle = this.color;

      this.canvasWidth = this.canvas.width;
      this.canvasHeight = this.canvas.height;
      this.clearCanvas();
      setInterval(wbProcessor.gatherPositionRequest, wb.options.requestInterval);
    },

    createTmpCanvas : function(from) {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      canvas.width = wbProcessor.canvasWidth;
      canvas.height = wbProcessor.canvasHeight;
      context.lineCap = "round";
      wbProcessor.tmpCanvas[from] = {
        canvas : canvas,
        context : context
      };
    },

    beginDraw : function(request) {
      wbProcessor.requestQueue.push(request);
    },

    drawing : function(request) {
      wbProcessor.gatherPosition(request);
      wbProcessor.context.lineWidth = request.lineWidth;
      wbProcessor.context.strokeStyle = request.color;
      wbProcessor.context.beginPath();
      wbProcessor.context.moveTo(request.startX + 0.5, request.startY + 0.5);
      wbProcessor.context.lineTo(request.lineToX + 0.5, request.lineToY + 0.5);
      wbProcessor.context.stroke();
      if (request.isRemote) {
        var context = wbProcessor.tmpCanvas[request.from].context;
        context.lineWidth = request.lineWidth;
        context.strokeStyle = request.color;
        context.beginPath();
        context.moveTo(request.startX + 0.5, request.startY + 0.5);
        context.lineTo(request.lineToX + 0.5, request.lineToY + 0.5);
        context.stroke();
      }
    },

    drawImg : function(request) {
      wbMsgClient.sendRequest(request);
      var imageSrc = request.imageSrc;
      var image = new Image();
      var imageSize = null;
      image.onload = function() {
        var width = image.width, height = image.height;
        var imageSize = wbProcessor.adjustImageSize(width, height);
        wbProcessor.clearCanvas();
        wbProcessor.context_O.drawImage(image, imageSize.left, imageSize.top, imageSize.width, imageSize.height);
        // bind image move event
        if (wb.options.moveImage) {
          var coordinates = [ 0, 0 ];
          var mousePrevX = 0, mousePrevY = 0;
          wb.canvas.on(EVT_MOVE, function(evt) {
            var mouseX = 0, mouseY = 0;
            coordinates = wb.getCoordinates(evt);
            var flag = intersect(imageSize.width, imageSize.height, imageSize.left, imageSize.top, coordinates[0], coordinates[1]);
            if (flag) {
              wb.canvas.addClass(MOVE_IMG);
              if (wb.mouseDown) {
                wbProcessor.moveImage(new wbRequests.MoveImageRequest(mousePrevX, mousePrevY, coordinates[0], coordinates[1]));
                imageSize.left = wbProcessor.currentImage.left;
                imageSize.top = wbProcessor.currentImage.top;
              }
              mousePrevX = coordinates[0], mousePrevY = coordinates[1];
            } else {
              wb.canvas.removeClass(MOVE_IMG);
            }
          });

          wb.canvas.on(EVT_START, function() {
            wb.mouseDown = true;
          });

          wb.canvas.on(EVT_END, function() {
            wb.mouseDown = false;
          });

          wbProcessor.currentImage = {
            "src" : image.src,
            "width" : imageSize.width,
            "height" : imageSize.height,
            "top" : imageSize.top,
            "left" : imageSize.left,
            "image" : image
          };
        }
      }
      image.onerror = function() {
        console.error("image :" + imageSrc + " isn't existed!")
      }
      image.src = imageSrc;
    },

    _drawMark : function(imageSize) {
      if (!wb.hasDrawMark) {
        wb.hasDrawMark = true;
        wbProcessor.context_O.save();
        wbProcessor.context_O.lineWidth = 2;
        wbProcessor.context_O.strokeStyle = "#FEA11C";
        // add mouse over mark
        wbProcessor.context_O.strokeRect(imageSize.left, imageSize.top, imageSize.width, imageSize.height);
      }
    },

    _redraw : function() {
      if (wb.hasDrawMark) {
        wbProcessor.clearCanvas();
        var currentImg = wbProcessor.currentImage;
        wbProcessor.context_O.drawImage(currentImg.image, currentImg.left, currentImg.top, currentImg.width, currentImg.height);
        wb.hasDrawMark = false;
      }
    },

    adjustImageSize : function(width, height) {
      var imgWidth = width;
      var imgHeight = height;
      var imageSize = {
        top : 0,
        left : 0,
        width : imgWidth,
        height : imgHeight
      };
      var canvasWidth = wbProcessor.canvasWidth;
      var canvasHeight = wbProcessor.canvasHeight;
      if (imgWidth > canvasWidth) {
        imageSize.width = canvasWidth;
        if (wb.options.keepImageProportions) {
          imageSize.height = Math.floor((canvasWidth / imgWidth) * imgHeight);
        } else {
          imageSize.height = imgHeight;
        }
      }
      if (imgHeight > canvasHeight) {
        imageSize.height = canvasHeight - 4;
        if (wb.options.keepImageProportions) {
          imageSize.width = Math.floor((canvasHeight / imgHeight) * imgWidth);
        } else {
          imageSize.width = imgWidth;
        }
      }
      if (imageSize.width < canvasWidth) {
        imageSize.left = Math.round((canvasWidth - imageSize.width) / 2);
      }
      if (imageSize.height < canvasHeight) {
        imageSize.top = Math.round((canvasHeight - imageSize.height) / 2);
      }
      return imageSize;
    },

    saveImg : function() {
      return Canvas2Image.saveAsPNG(wbProcessor.canvas_O, true);
    },

    drawText : function(request) {
      wbMsgClient.sendRequest(request);
      var fontStyle = "";
      if (request.isItalic == true) {
        fontStyle = "italic "
      }
      if (request.isBold == true) {
        fontStyle = fontStyle + "bold ";
      }
      fontStyle = fontStyle + request.fontSize + "px " + request.fontFamily;
      var fontColor = request.color;
      var lineHeight = wbProcessor.determineFontHeight("font-family:" + request.fontFamily + ";font-size:" + request.fontSize + "px;");
      wbProcessor.paintText(request.startX, request.startY, request.text, fontStyle, fontColor, lineHeight, request.isUnderLine);
    },

    paintText : function(x, y, text, fontStyle, fontColor, lineHeight, isUnderLine) {
      var context = wbProcessor.context_O;
      context.fillStyle = fontColor;
      context.font = fontStyle;
      var textWidth = TCC.find("#font_textarea").width();
      var textLines = wbProcessor.getLines(wbProcessor.context, text, textWidth, fontStyle);
      for ( var i = 0, len = textLines.length; i < len; i++) {
        context.fillText(textLines[i], x, y + i * lineHeight);
        if (isUnderLine) {
          var textWidth = context.measureText(textLines[i]).width;
          context.lineWidth = 1;
          context.strokeStyle = fontColor;
          context.beginPath();
          context.moveTo(x + 0.5, y + 2.5 + i * lineHeight);
          context.lineTo(x + textWidth + 0.5, y + 2.5 + i * lineHeight);
          context.stroke();
          context.closePath();
        }
      }
    },

    getLines : function(ctx, text, maxLength, textStyle) {
      var wa = text.split(" "), textArray = [], lastText = "", measure = 0;
      ctx.font = textStyle;
      for ( var i = 0; i < wa.length; i++) {
        var w = wa[i];
        measure = ctx.measureText(lastText + w).width;
        if (measure < maxLength) {
          lastText += (" " + w);
        } else {
          textArray.push(lastText);
          lastText = w;
        }
        if (i === wa.length - 1) {
          textArray.push(lastText);
          break;
        }
      }
      return textArray;
    },

    determineFontHeight : function(fontStyle) {
      var body = document.getElementsByTagName("body")[0];
      var dummy = document.createElement("div");
      var dummyText = document.createTextNode("M");
      dummy.appendChild(dummyText);
      dummy.setAttribute("style", fontStyle);
      body.appendChild(dummy);
      var result = dummy.offsetHeight;
      body.removeChild(dummy);
      return result;
    },

    beginLine : function(request) {
      wbProcessor.requestQueue.push(request);
    },

    createRemoteCanvas : function(from) {
      var tmp = document.createElement("canvas");
      var tmpContext = tmp.getContext("2d");
      tmp.width = wbProcessor.canvasWidth;
      tmp.height = wbProcessor.canvasHeight;
      tmpContext.lineCap = "round";

      wbProcessor.remoteCanvas[from] = {
        canvas : tmp,
        context : tmpContext
      };
    },

    drawLine : function(request) {
      wbProcessor.gatherPosition(request);
      var context = wbProcessor.context;
      if (request.isRemote) {
        context = wbProcessor.remoteCanvas[request.from].context;
      }
      context.clearRect(0, 0, wbProcessor.canvasWidth, wbProcessor.canvasHeight);
      wbProcessor.syncCanvases(request, context);
      context.lineWidth = request.lineWidth;
      context.strokeStyle = request.color;
      context.beginPath();
      context.moveTo(request.startX + 0.5, request.startY + 0.5);
      context.lineTo(request.lineToX + 0.5, request.lineToY + 0.5);
      context.stroke();
      context.closePath();
    },

    beginRectangle : function(request) {
      wbProcessor.requestQueue.push(request);
    },

    drawRectangle : function(request) {
      wbProcessor.gatherPosition(request);
      var context = wbProcessor.context;
      if (request.isRemote) {
        context = wbProcessor.remoteCanvas[request.from].context;
      }
      var sx = request.startX;
      var sy = request.startY;
      var ex = request.moveToX;
      var ey = request.moveToY;
      var tmp = 0;
      if (ex < sx) {
        tmp = sx;
        sx = ex;
        ex = tmp;
      }
      if (ey < sy) {
        tmp = sy;
        sy = ey;
        ey = tmp;
      }
      context.clearRect(0, 0, wbProcessor.canvasWidth, wbProcessor.canvasHeight);
      wbProcessor.syncCanvases(request, context);
      if (!request.isFilled) {
        context.lineWidth = request.lineWidth;
        context.strokeStyle = request.color;
      } else {
        context.fillStyle = request.color;
      }
      context.beginPath();
      context.rect(sx + 0.5, sy + 0.5, ex - sx, ey - sy);
      context.closePath();
      request.isFilled ? context.fill() : context.stroke();
    },

    beginOval : function(request) {
      wbProcessor.requestQueue.push(request);
    },

    drawOval : function(request) {
      wbProcessor.gatherPosition(request);
      var context = wbProcessor.context;
      if (request.isRemote) {
        context = wbProcessor.remoteCanvas[request.from].context;
      }

      var x = request.startX;
      var y = request.startY;
      var w = request.width;
      var h = request.height;

      var kappa = 0.5522848;
      var ox = (w / 2) * kappa;
      var oy = (h / 2) * kappa;
      var xe = x + w;
      var ye = y + h;
      var xm = x + w / 2;
      var ym = y + h / 2;

      context.clearRect(0, 0, wbProcessor.canvasWidth, wbProcessor.canvasHeight);
      wbProcessor.syncCanvases(request, context);
      if (!request.isFilled) {
        context.lineWidth = request.lineWidth;
        context.strokeStyle = request.color;
      } else {
        context.fillStyle = request.color;
      }
      context.beginPath();
      context.moveTo(x, ym);
      context.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
      context.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
      context.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
      context.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
      context.closePath();
      request.isFilled ? context.fill() : context.stroke();
    },

    clear : function(request) {
      wbMsgClient.sendRequest(request);
      wbProcessor.clearCanvas();
      wbUndoManager.clearHistory();
    },

    clearCanvas : function() {
      wbProcessor.context.clearRect(0, 0, wbProcessor.canvasWidth, wbProcessor.canvasHeight);
      wbProcessor.context_O.clearRect(0, 0, wbProcessor.canvasWidth, wbProcessor.canvasHeight);
      wbProcessor.setCanvasBackgroud();
    },

    setCanvasBackgroud : function() {
      wbProcessor.context_O.fillStyle = wb.options.backgroundColor;
      wbProcessor.context_O.fillRect(0, 0, wbProcessor.canvasWidth, wbProcessor.canvasHeight);
    },

    updateLineWidth : function(request) {
      wbMsgClient.sendRequest(request);
      wbProcessor.lineWidth = request.lineWidth;
    },

    updateColor : function(request) {
      wbMsgClient.sendRequest(request);
      wbProcessor.color = request.color;
    },

    undo : function(request) {
      wbMsgClient.sendRequest(request);
      wbUndoManager.undo();
    },

    redo : function(request) {
      wbMsgClient.sendRequest(request);
      wbUndoManager.redo();
    },

    moveImage : function(request) {
      wbMsgClient.sendRequest(request);
      wbProcessor.clearCanvas();
      var currentImage = this.currentImage;
      var mouseX = request.mouseX, mouseY = request.mouseY, mousePrevX = request.mousePrevX, mousePrevY = request.mousePrevY;
      var left = currentImage.left + mouseX - mousePrevX;
      var top = currentImage.top + mouseY - mousePrevY;
      wbProcessor.context_O.drawImage(currentImage.image, left, top, currentImage.width, currentImage.height);
      currentImage.left = left;
      currentImage.top = top;
    },

    endDraw : function(request) {
      if (request.isRemote) {
        var from = request.from, remoteCanvas = wbProcessor.remoteCanvas[from];
        // draw line,rect and oval
        if (remoteCanvas !== undefined) {
          var remoteContext = remoteCanvas.context;
          // copy remote canvas to original canvas
          wbProcessor.context_O.drawImage(remoteCanvas.canvas, 0, 0);
          // clear remote canvas
          remoteContext.clearRect(0, 0, wbProcessor.canvasWidth, wbProcessor.canvasHeight);
        } else {
          var tmpCanvas = wbProcessor.tmpCanvas[from];
          if (tmpCanvas !== undefined) {
            wbProcessor.context_O.drawImage(tmpCanvas.canvas, 0, 0);
            tmpCanvas.context.clearRect(0, 0, wbProcessor.canvasWidth, wbProcessor.canvasWidth);
          }
        }
      } else {
        wbProcessor.requestQueue.push(request);
        wbProcessor.context_O.drawImage(wbProcessor.canvas, 0, 0);
        wbProcessor.context.clearRect(0, 0, wbProcessor.canvasWidth, wbProcessor.canvasHeight);
      }
    },

    gatherPosition : function(request) {
      if (request.isRemote) {
        return;
      }
      var cmd = request.cmd, moveToX = 0, moveToY = 0;
      switch (cmd) {
      case wbRequests.CMD.DRAWING:
      case wbRequests.CMD.DRAWING_LINE:
        moveToX = request.lineToX;
        moveToY = request.lineToY;
        break;
      case wbRequests.CMD.DRAWING_RECT:
        moveToX = request.moveToX;
        moveToY = request.moveToY;
        break;
      case wbRequests.CMD.DRAWING_OVAL:
        moveToX = request.width;
        moveToY = request.height;
        break;
      }
      wbProcessor.requestQueue.push(moveToX + "," + moveToY);
    },

    gatherPositionRequest : function() {
      if (wbProcessor.requestQueue.length === 0) {
        return;
      } else {
        var requestContent = [];
        for ( var i = 0, len = wbProcessor.requestQueue.length; i < len; i++) {
          var request = wbProcessor.requestQueue[i];
          var cmd = request.cmd;
          if (cmd === wbRequests.CMD.BEGIN_DRAW) {
            wbMsgClient.sendRequest(request);
            wbProcessor.currentCmd = wbRequests.CMD.DRAWING;
          } else if (cmd === wbRequests.CMD.BEGIN_DRAW_LINE) {
            wbMsgClient.sendRequest(request);
            wbProcessor.currentCmd = wbRequests.CMD.DRAWING_LINE;
          } else if (cmd === wbRequests.CMD.BEGIN_DRAW_RECT) {
            wbMsgClient.sendRequest(request);
            wbProcessor.currentCmd = wbRequests.CMD.DRAWING_RECT;
          } else if (cmd === wbRequests.CMD.BEGIN_DRAW_OVAL) {
            wbMsgClient.sendRequest(request);
            wbProcessor.currentCmd = wbRequests.CMD.DRAWING_OVAL;
          } else {
            if (cmd === wbRequests.CMD.END_DRAW) {
              if (requestContent.length > 0) {
                var orbitRequest = new wbRequests.OrbitRequest(wbProcessor.currentCmd, requestContent.join(","));
                wbMsgClient.sendRequest(orbitRequest);
                requestContent = [];
                wbProcessor.currentCmd = null;
              }
              wbMsgClient.sendRequest(request);
            } else {
              requestContent.push(request);
            }
          }
        }
        if (requestContent.length > 0) {
          var orbitRequest = new wbRequests.OrbitRequest(wbProcessor.currentCmd, requestContent.join(","));
          wbMsgClient.sendRequest(orbitRequest);
          requestContent = [];
        }
        wbProcessor.requestQueue = [];
      }
    },

    syncCanvases : function(request, context) {
      for ( var from in wbProcessor.tmpCanvas) {
        if (request.from !== from) {
          context.drawImage(wbProcessor.tmpCanvas[from].canvas, 0, 0);
        }
      }
    }
  }
})();