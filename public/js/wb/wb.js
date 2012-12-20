$(function() {
  var socket = io.connect();

  $("#nick").focus();

  $("#set_nickname").submit(function(evt) {
    socket.emit("nickname", $("#nick").val(), function(set) {
      if (!set) {
        $("#nickname").hide();
        wb.init("#whiteboard", {
          width : 1000,
          height : 450,
          imagePos : "center",
          toolbarPos : "left",
          moveImage : true
        });
        wbMsgClient.init(socket);
        $("#online_users").show();
        $("#whiteboard").show();
        $("#toolbar").show();
      } else {
        $("#nickname_err").css("visibility", "visible");
      }
    });
    return false;
  });

  // clear wb
  $("#clear_wb").click(function(evt) {
    wb.clear();
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
});