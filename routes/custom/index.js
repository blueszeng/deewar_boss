var express = require('express');
var router = express.Router();

var queryrouter = require('./query');
var feedbackrouter = require('./feedback');
var accountrouter = require('./account');
var phonerouter = require('./phone');
var voicerouter = require('./voice');
var taobaorouter = require('./taobao');
var jingdongrouter = require('./jingdong');
var taobaoaddrrouter = require('./taobaoaddr');
var nashuirouter = require('./nashui');
var daoweirouter = require('./daowei');

router.use('/query',queryrouter);
router.use('/feedback',feedbackrouter);
router.use('/account',accountrouter);
router.use('/phone',phonerouter);
router.use('/voice',voicerouter);
router.use('/taobao',taobaorouter);
router.use('/taobaoaddr',taobaoaddrrouter);
router.use('/jingdong',jingdongrouter);
router.use('/nashui',nashuirouter);
router.use('/daowei',daoweirouter);

module.exports = router;