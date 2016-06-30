/**
 * Created by jimmychou on 15/1/14.
 */
var express = require('express');
var router = express.Router();

var nashuirouter = require('./nashui/index');

router.use('/nashui',nashuirouter);

module.exports = router;