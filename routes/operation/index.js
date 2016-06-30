/**
 * Created by jimmychou on 15/1/12.
 */
var express = require('express');
var router = express.Router();

var zonerouter = require('./zone');
var siterouter = require('./site');
var notifyrouter = require('./notify');
var menurouter = require('./menu');
var couponrouter = require('./coupon');
var couponsendrouter = require('./couponsend');
var channelrouter = require('./channel');

router.use('/zone',zonerouter);
router.use('/site',siterouter);
router.use('/notify',notifyrouter);
router.use('/menu',menurouter);
router.use('/coupon',couponrouter);
router.use('/couponsend',couponsendrouter);
router.use('/channel',channelrouter);

module.exports = router;