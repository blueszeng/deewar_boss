/**
 * Created by jimmychou on 15/1/14.
 */
var express = require('express');
var router = express.Router();

var staffrouter = require('./staff');
var dashboardrouter = require('./dashboard');
var getshoesrouter = require('./getshoes');
var commonrouter = require('./common');
var factoryrouter = require('./factory');
var returnshoesrouter = require('./returnshoes');
var orderrouter = require('./order');

router.use('/staff',staffrouter);
router.use('/dashboard',dashboardrouter);
router.use('/getshoes',getshoesrouter);
router.use('/common',commonrouter);
router.use('/factory',factoryrouter);
router.use('/returnshoes',returnshoesrouter);
router.use('/order',orderrouter);

module.exports = router;