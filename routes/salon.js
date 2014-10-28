var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('salon');
});

router.get('/view', function(req, res) {
    res.render('view-salon');
});

module.exports = router;
