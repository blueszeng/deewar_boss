var express = require('express');
var router = express.Router();

var listrouter = require('./list');
var expireinrouter = require('./expirein');
var expireoutrouter = require('./expireout');
var expiretelrouter = require('./expiretel');
var queryrouter = require('./query');
var nashuirouter = require('./nashui');

router.use('/list',listrouter);
router.use('/expirein',expireinrouter);
router.use('/expireout',expireoutrouter);
router.use('/expiretel',expiretelrouter);
router.use('/query',queryrouter);
router.use('/nashui',nashuirouter);

module.exports = router;