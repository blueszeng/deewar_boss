var express = require('express');
var router = express.Router();

var listrouter = require('./list');
var todayrouter = require('./today');
var couponrouter = require('./coupon');

router.use('/list',listrouter);
router.use('/today',todayrouter);
router.use('/coupon',couponrouter);

module.exports = router;