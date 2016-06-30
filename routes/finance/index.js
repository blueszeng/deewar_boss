var express = require('express');
var router = express.Router();

var commissionrouter = require('./commission');
var commissionedrouter = require('./commissioned');
var refundrouter = require('./refund');
var refundedrouter = require('./refunded');


router.use('/commission',commissionrouter);
router.use('/commissioned',commissionedrouter);
router.use('/refund',refundrouter);
router.use('/refunded',refundedrouter);

module.exports = router;