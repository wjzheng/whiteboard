module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('index.html');
  });

  app.get('/wb', function(req, res) {
    res.render('wb.html', {
      layout : false
    });
  });
}