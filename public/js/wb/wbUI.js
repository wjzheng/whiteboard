(function() {

  var hasTouch = 'ontouchstart' in window;
  // constants
  var PENCIL_ACTIVE = "pencil_active", BTN_CURVE = "btn_curve",
  // CSS
  BTN_SELECTED = "wb_btn_selected", RECTANGLE_ACTIVE = "rectangle_active", OVAL_ACTIVE = "oval_active", ERASER_ACTIVE = "eraser_active", MOVE_IMG = "move_image",
  // event
  EVT_START = hasTouch ? "touchstart" : "mousedown", EVT_MOVE = hasTouch ? "touchmove" : "mousemove", EVT_END = hasTouch ? "touchend" : "mouseup";
  EVT_KEYDOWN = "keydown";

  window.wb = {
    options : {
      lineWidth : 3,
      color : "#000",
      eraserSize : 10,
      keepImageProportions : true,
      requestInterval : 500,
      undoSteps : 5,
      textareaSize : [ 200, 50 ],
      // tool bar position, left|bottom
      toolbarPos : "bottom",
      toolbarHeight : 41,
      backgroundColor : "#fff"
    },

    init : function(wbId, options) {
      this._prepareParams(wbId, options);
      this._renderUI();
      this._bindUI();
      wbProcessor.init();
      wbUndoManager.init(wb.options.undoSteps);
      this.wbContainer.show();
      this.wbOffset = this.wbContainer.find(".wbCanvas").offset();
    },

    _prepareParams : function(wbId, options) {
      this.options = TCC.extend(this.options, options);
      this.wbContainer = TCC.find(wbId);
      this.wbMask = TCC.find(".wb_mask");
      this.wbId = wbId;
      this.canvas = TCC.find("#canvas_t");
      this.listener = [];
      this.wbOffset = null;
      this.lineWidth = wb.options.lineWidth;
      this.mouseDown = false;
    },

    _renderUI : function() {
      var canvasFullWidth = this.wbContainer.find(".wbCanvas").width();
      var canvasFullHeight = this.wbContainer.find(".wbCanvas").height();
      var width = this.options.width || canvasFullWidth;
      var height = this.options.height || canvasFullHeight;
      TCC.find("canvas").each(function(c) {
        c.height = height;
        c.width = width;
      });
      this.initColorPicker();
      this.initFontSelector();
    },

    _bindUI : function() {
      // auto active pencil
      wb.activePencil();
      // bind event to toolbar buttons
      TCC.find("#whiteboard").delegate("click", ".btn-group .btn", function(evt) {
        var target = evt.currentTarget;
        var menuId = target.attr("id");
        wb.beforeDraw(menuId);
        switch (menuId) {
        case "sketch":
          wb.activePencil();
          break;
        case "line":
          wb.activeLine();
          break;
        case "rectFrame":
          wb.activeRect();
          break;
        case "rectFilled":
          wb.activeRect(true);
          break;
        case "ovalFrame":
          wb.activeOval();
          break;
        case "ovalFilled":
          wb.activeOval(true);
          break;
        case "font":
          wb.activeFontSelector(target);
          break;
        case "eraser":
          wb.activeEraser();
          break;
        case "lineWidth":
          wb.activeLinewidth(target);
          break;
        case "color":
          wb.activeColorPicker(target);
          break;
        case "undo":
          TCC.find(".wb_toolbar_menu").hide();
          wbProcessor.undo(new wbRequests.UndoRequest());
          break;
        }
      });

      // bind event to line width selector
      TCC.find("#line_width").delegate("click", ".lw_bar", function(evt) {
        var target = evt.currentTarget;
        var id = target.attr("id");
        var lw = parseInt(id.substring(3));
        wb.changeLineWidth(lw);
        target.parent().find(".lw_bar.selected").removeClass("selected");
        target.addClass("selected");
        TCC.find("#line_width").hide();
      });

      // add shortcut key.
      TCC.find(document).on(EVT_KEYDOWN, wb.addShortcut);
    },

    initColorPicker : function() {
      TCC.find("#color").colorPicker({
        parentContainer : "#mainArea",
        colorChangeFn : function(color) {
          wb.changeColor(color);
        }
      });
      TCC.find("#lw_" + this.options.lineWidth).addClass("selected");
    },

    initFontSelector : function() {
      var that = this;
      var textArea = TCC.find("#font_textarea");
      // draw text on whiteboard
      textArea.on("blur", function(evt) {
        var target = evt.currentTarget;
        if (TCC.trim(target.val()) !== "") {
          var left = parseInt(textArea.css("left")) - 9;
          var top = parseInt(textArea.css("top")) + 9;
          // draw text content on wb
          wb.beginDrawText(left, top);
          // clear text content
          target.val("");
          target.hide();
        }
      });

      // auto expand teaxarea height
      textArea.on("keyup", function(evt) {
        var target = evt.currentTarget;
        var height = target.get(0).scrollTop + target.height();
        if (height > wb.options.textareaSize[1]) {
          var pos = target.position();
          if (pos.top + height > wb.options.height) {
            height = wb.canvasHeight - pos.top;
          }
          target.css("height", height + "px");
        }
      });
    },

    activePencil : function(event) {
      wb.canvas.on(EVT_START, wb.beginDraw);
    },

    activeLine : function() {
      wb.canvas.on(EVT_START, wb.beginLine);
    },

    activeRect : function(isFilled) {
      wb.canvas.on(EVT_START, wb.beginRectangle, {
        isFilled : isFilled
      });
      wb.canvas.addClass(RECTANGLE_ACTIVE);
    },

    activeOval : function(isFilled) {
      wb.canvas.on(EVT_START, wb.beginOval, {
        isFilled : isFilled
      });
      wb.canvas.addClass(OVAL_ACTIVE);
    },

    activeFontSelector : function(target) {
      var that = this;
      var fontSelector = TCC.find("#font_menu");
      var textArea = TCC.find("#font_textarea");
      var btnOffset = target.offset();
      fontSelector.css({
        "left" : btnOffset.left + target.originalObj.outerWidth(true),
        "top" : btnOffset.top + (target.originalObj.outerHeight(true) / 2) - fontSelector.originalObj.outerHeight(true) / 2
      });
      if (!fontSelector.isVisible()) {
        wb.canvas.on(EVT_START, function(event) {
          if (!textArea.isVisible() || (textArea.isVisible() && TCC.trim(textArea.val()) == "")) {
            var coordinates = wb.getCoordinates(event);
            textArea.css({
              "left" : coordinates[0] + "px",
              "top" : coordinates[1] + "px",
              "font-size" : parseInt(TCC.find("#font_size").val()) + "px",
              "font-family" : TCC.find("#font_family").val(),
              "font-weight" : TCC.find("#font_boldBtn").hasClass("active") ? "bold" : "normal",
              "font-style" : TCC.find("#font_italicBtn").hasClass("active") ? "italic" : "normal",
              "text-decoration" : TCC.find("#font_underlineBtn").hasClass("active") ? "underline" : "none"
            });
            textArea.fadeIn("fast", function() {
              textArea.originalObj.focus();
            });
            fontSelector.hide();
          }
        });
        fontSelector.show();
      } else {
        fontSelector.hide();
        target.removeClass("active");
        wb.canvas.on(EVT_END, wb.afterDraw);
      }
    },

    activeLinewidth : function(target) {
      var lwContainer = TCC.find("#line_width");
      if (lwContainer.isVisible()) {
        lwContainer.hide();
      } else {
        var btnOffset = target.offset();
        lwContainer.css({
          "left" : btnOffset.left + target.originalObj.outerWidth(true),
          "top" : btnOffset.top + (target.originalObj.outerHeight(true) / 2) - lwContainer.originalObj.outerHeight(true) / 2
        });
        TCC.find(".wb_toolbar_menu").hide();
        lwContainer.show();
      }
    },

    activeColorPicker : function(target) {
      var colorPicker = this.wbContainer.find(".colorPicker");
      if (!colorPicker.hasClass("wb_toolbar_menu")) {
        colorPicker.addClass("wb_toolbar_menu");
      }
      if (!colorPicker.isVisible()) {
        var btnOffset = target.position();
        colorPicker.css({
          "left" : btnOffset.left + (this.options.toolbarPos === "left" ? target.width() + 6 : 0) + "px",
          "top" : btnOffset.top + (this.options.toolbarPos === "bottom" ? target.height() + 6 : 0) + "px"
        });
        TCC.find(".wb_toolbar_menu").hide();
        colorPicker.show();
      } else {
        colorPicker.hide();
      }
    },

    activeEraser : function() {
      wb.canvas.on(EVT_START, wb.beginDraw, {
        eraser : true,
        color : wb.options.backgroundColor,
        lineWidth : wb.options.eraserSize
      });
      wb.canvas.addClass(ERASER_ACTIVE);
    },

    changeLineWidth : function(lineWidth) {
      wb.lineWidth = lineWidth;
      wbProcessor.updateLineWidth(new wbRequests.SetLineWidthRequest(lineWidth));
    },

    changeColor : function(color) {
      wbProcessor.updateColor(new wbRequests.SetColorRequest(color));
    },

    getCoordinates : function(event) {
      var coordinates = [], originalEvent = event.originalEvent;
      if (hasTouch) {
        coordinates[0] = originalEvent.changedTouches[0].clientX - wb.wbOffset.left;
        coordinates[1] = originalEvent.changedTouches[0].clientY - wb.wbOffset.top;
      } else {
        if (event.offsetX || event.offsetX == 0) {
          coordinates[0] = event.offsetX;
          coordinates[1] = event.offsetY;
        } else if (originalEvent.layerX || originalEvent.layerX == 0) {
          coordinates[0] = originalEvent.layerX;
          coordinates[1] = originalEvent.layerY;
        }
      }
      return coordinates;
    },

    beginDraw : function(event) {
      event.preventDefault();
      event.stopPropagation();
      var eData = event.data;
      var isEraser = eData && eData.eraser === true ? true : false;
      var color = eData && eData.color, lineWidth = eData && eData.lineWidth;
      var coordinates = wb.getCoordinates(event);
      var startX = coordinates[0], startY = coordinates[1];
      wbProcessor.beginDraw(new wbRequests.BeginDrawRequest(startX, startY, isEraser));
      wb.canvas.on(EVT_MOVE, function(event) {
        coordinates = wb.getCoordinates(event);
        if (isEraser) {
          wbProcessor.drawing(new wbRequests.DrawingRequest(startX, startY, coordinates[0], coordinates[1], color, lineWidth));
        } else {
          wbProcessor.drawing(new wbRequests.DrawingRequest(startX, startY, coordinates[0], coordinates[1]));
        }
        startX = coordinates[0];
        startY = coordinates[1];
      });
      wb.canvas.on(EVT_END, wb.afterDraw);
      wbUndoManager.saveState();
      return false;
    },

    beginLine : function(event) {
      event.preventDefault();
      event.stopPropagation();
      var coordinates = wb.getCoordinates(event);
      var startX = coordinates[0], startY = coordinates[1];
      wbProcessor.beginLine(new wbRequests.BeginDrawLineRequest(startX, startY));
      wb.canvas.on(EVT_MOVE, function(event) {
        coordinates = wb.getCoordinates(event);
        var moveX = coordinates[0], moveY = coordinates[1];
        wbProcessor.drawLine(new wbRequests.DrawingLineRequest(startX, startY, moveX, moveY));
      });
      wb.canvas.on(EVT_END, wb.afterDraw);
      wbUndoManager.saveState();
      return false;
    },

    beginRectangle : function(event) {
      event.preventDefault();
      event.stopPropagation();
      var isFilled = event.data.isFilled || false;
      var coordinates = wb.getCoordinates(event);
      var startX = coordinates[0], startY = coordinates[1];
      wbProcessor.beginRectangle(new wbRequests.BeginDrawRectRequest(startX, startY, isFilled));
      wb.canvas.on(EVT_MOVE, function(event) {
        coordinates = wb.getCoordinates(event);
        var moveX = coordinates[0], moveY = coordinates[1];
        wbProcessor.drawRectangle(new wbRequests.DrawingRectRequest(startX, startY, moveX, moveY, isFilled));
      });
      wb.canvas.on(EVT_END, wb.afterDraw);
      wbUndoManager.saveState();
      return false;
    },

    beginOval : function(event) {
      event.preventDefault();
      event.stopPropagation();
      var isFilled = event.data.isFilled || false;
      var coordinates = wb.getCoordinates(event);
      var startX = coordinates[0], startY = coordinates[1];
      wbProcessor.beginOval(new wbRequests.BeginDrawOvalRequest(startX, startY, isFilled));
      wb.canvas.on(EVT_MOVE, function(event) {
        coordinates = wb.getCoordinates(event);
        var width = coordinates[0] - startX, height = coordinates[1] - startY;
        wbProcessor.drawOval(new wbRequests.DrawingOvalRequest(startX, startY, width, height, isFilled));
      });
      wb.canvas.on(EVT_END, wb.afterDraw);
      wbUndoManager.saveState();
      return false;
    },

    beginDrawText : function(left, top) {
      wbUndoManager.saveState();
      var text = TCC.find("#font_textarea").val();
      if (TCC.trim(text) !== "") {
        var isItalic = TCC.find("#font_italicBtn").hasClass("active");
        var fontSize = parseInt(TCC.find("#font_size").val());
        var fontFamily = TCC.find("#font_family").val();
        if (isNaN(fontSize)) {
          fontSize = wb.options.fontSize;
        }
        var color = TCC.find("#whiteboard .colorPickerBtn").attr("color");
        var isBold = TCC.find("#font_boldBtn").hasClass("active");
        var isUnderLine = TCC.find("#font_underlineBtn").hasClass("active");
        wbProcessor.drawText(new wbRequests.DrawTextRequest(left, top, text, fontSize, fontFamily, isItalic, isBold, isUnderLine, color));
      }
    },

    beforeDraw : function(menu) {
      if (menu === "color" || menu === "lineWidth" || menu === "undo") {
        return;
      }
      var selectedBtn = TCC.find("." + "active");
      if (menu && menu == selectedBtn.attr("id")) {
        return;
      }
      TCC.find("#font_textarea").hide();
      TCC.find(".popover.in").hide();
      TCC.find("#whiteboard .btn-group>button.btn").removeClass("active");
      TCC.find("#" + menu).addClass("active");
      wb.canvas.unbind();
      wb.canvas.removeClass(ERASER_ACTIVE);
      wb.canvas.removeClass(RECTANGLE_ACTIVE);
      wb.canvas.removeClass(OVAL_ACTIVE);
    },

    afterDraw : function() {
      wb.canvas.unbind(EVT_MOVE);
      wb.canvas.unbind(EVT_END);
      wbProcessor.endDraw(new wbRequests.EndDrawRequest());
    },

    registerController : function(controller) {
      wbProcessor.controller = controller;
    },

    registerListener : function(event, fn, scope) {
      this.listener[event] = {
        fn : fn,
        scope : scope
      };
    },

    notifyListener : function(event) {
      var listener = this.listener[event];
      if (listener !== undefined) {
        listener.fn.apply(listener.scope, Array.prototype.slice.call(arguments).slice(1));
      }
    },

    loadImage : function(imageSrc) {
      wb.beforeDraw();
      wbProcessor.drawImg(new wbRequests.DrawImageRequest(imageSrc));
      wbUndoManager.saveState();
    },

    clear : function() {
      wbProcessor.clear(new wbRequests.ClearRequest());
    },

    getImage : function() {
      return wbProcessor.saveImg();
    },

    addShortcut : function(event) {
      var evt = event.originalEvent;
      var target = event.currentTarget;
      if (evt.ctrlKey || evt.metaKey) {
        switch (evt.keyCode) {
        case 38:// up, add line width
          wbProcessor.updateLineWidth(new wbRequests.SetLineWidthRequest(wb.lineWidth++));
          event.preventDefault();
          break;
        case 40:// down, reduce line width
          var lw = wb.lineWidth--;
          if (lw < 0) {
            lw = 1;
          }
          wbProcessor.updateLineWidth(new wbRequests.SetLineWidthRequest(lw));
          event.preventDefault();
          break;
        case 89:// ctrl +y, redo
          wbProcessor.redo(new wbRequests.RedoRequest());
          event.preventDefault();
          break;
        case 90: // ctrl +z, undo
          wbProcessor.undo(new wbRequests.UndoRequest());
          event.preventDefault();
          break;
        }
      }
    }
  }
})();