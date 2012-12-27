$(function() {
  // init socket client
  var socket = io.connect();
  // init whiteboard
  wb.init("#whiteboard", {
    imagePos : "center",
    toolbarPos : "left",
    moveImage : true
  });
  // init image slider
  TCC.find("#wbImgSlider").imageSlider({
    width : $("#whiteboard").width(),
    clickItemFn : function(itemId) {
      var imagePath = "/files/wb/" + itemId + ".png";
      wb.loadImage(imagePath);
    }
  });
  
  // init wb mesage client
  var username = $("#username").text();
  wbMsgClient.init(socket, username);

  // clear wb
  $("#clear_wb").click(function(evt) {
    wb.clear();
  });

  // toggle online user panel
  $("#onlineUserBtn").click(function(evt) {
    var btn = $(this);
    var h = btn.height();
    var pos = btn.position();
    $("#onlineUsers").css({
      top : pos.top + h + 5,
      left : pos.left
    });
    $("#onlineUsers").toggle();
  });

  // save image
  $("#save_img").click(function(evt) {
    var imageContent = wb.getImage();
    wbMsgClient.saveImage(imageContent, function(err, response) {
      if (!err) {
        // add image item to image slider
        var imageId = response.imageId;
        var thumbnailPath = response.thumbnailPath;
        TCC.find("#wbImgSlider").imageSlider("addItem", {
          id : imageId,
          imageSrc : thumbnailPath
        });
      } else {
        alert(err);
      }
    });
  });

  // click image
  $("#wb_images").delegate(".imageItem", "click", function() {
    var filePath = $(this).data("filePath");
    wb.loadImage(filePath);
  });

  // handle upload request
  new qq.FineUploader({
    element : $('#uploadImageList')[0],
    multiple : false,
    validation : {
      allowedExtensions : [ "jpg", "gif", "png", "bmp", "jpeg" ],
      sizeLimit : 5 * 1024 * 1024
    },
    request : {
      endpoint : "/ajaxUploader"
    },
    callbacks : {
      onComplete : function(id, fileName, responseJSON) {
        wb.loadImage("/uploads/" + fileName);
      },
      onError : function(event, id, fileName, reason) {
        qq.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
      }
    },
    button : $('#upload_img')[0]
  });
});