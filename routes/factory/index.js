/**
 * Created by jimmychou on 15/1/27.
 */
var express = require('express');
var router = express.Router();

var inrouter = require('./in');
var listrouter = require('./list');

router.use('/in',inrouter);
router.use('/list',listrouter);

module.exports = router;