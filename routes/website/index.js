/**
 * Created by jimmychou on 15/1/27.
 */
var express = require('express');
var router = express.Router();

var marketrouter = require('./market');
var knowledgerouter = require('./knowledge');

router.use('/market',marketrouter);
router.use('/knowledge',knowledgerouter);

module.exports = router;