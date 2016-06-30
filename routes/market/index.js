var express = require('express');
var router = express.Router();

var accountrouter = require('./account');
var agentrouter = require('./agent');
var agentallrouter = require('./agentall');
var agentprofilerouter = require('./agentprofile');
var agentnosettledrouter = require('./agentnosettled');
var agentsettlingrouter = require('./agentsettling');
var agentsettledrouter = require('./agentsettled');

router.use('/account',accountrouter);
router.use('/agent',agentrouter);
router.use('/agentall',agentallrouter);
router.use('/agentprofile',agentprofilerouter);
router.use('/agentnosettled',agentnosettledrouter);
router.use('/agentsettling',agentsettlingrouter);
router.use('/agentsettled',agentsettledrouter);

module.exports = router;