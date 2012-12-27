$(function() {

  var socket = io.connect();
  wb.init("#whiteboard", {
    imagePos : "center",
    toolbarPos : "left",
    moveImage : true
  });

  var imageList = [ {
    id : "1",
    imageSrc : "/img/tool/chatroom/x.jpg",
    tips : "美女1"
  }, {
    id : "2",
    imageSrc : "/img/tool/chatroom/y.jpg",
    tips : "美女2"
  }, {
    id : "3",
    imageSrc : "/img/tool/chatroom/x.jpg",
    tips : "美女3"
  }, {
    id : "4",
    imageSrc : "/img/tool/chatroom/y.jpg",
    tips : "美女4"
  }, {
    id : "5",
    imageSrc : "/img/tool/chatroom/x.jpg",
    tips : "美女5"
  }, {
    id : "6",
    imageSrc : "/img/tool/chatroom/y.jpg"
  }, {
    id : "7",
    imageSrc : "/img/tool/chatroom/x.jpg"
  }, {
    id : "8",
    imageSrc : "/img/tool/chatroom/y.jpg"
  }, {
    id : "9",
    imageSrc : "/img/tool/chatroom/x.jpg"
  }, {
    id : "10",
    imageSrc : "/img/tool/chatroom/y.jpg"
  }, {
    id : "11",
    imageSrc : "/img/tool/chatroom/x.jpg"
  }, {
    id : "12",
    imageSrc : "/img/tool/chatroom/y.jpg"
  }, {
    id : "13",
    imageSrc : "/img/tool/chatroom/x.jpg"
  }, {
    id : "14",
    imageSrc : "/img/tool/chatroom/y.jpg"
  } ];

  TCC.find("#wbImgSlider").imageSlider({
    width : 1110,
    dataSource : imageList,
    clickItemFn : function(itemId) {
      console.log("itemId:" + itemId);
    }
  });
  // init wb client
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
    wbMsgClient.saveImage(imageContent);
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