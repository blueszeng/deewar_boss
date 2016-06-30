var express = require('express');
var db = require('../../../services/db');
var nashuiOrderService = require('../../../services/nashui/order');
var async = require('async');
var router = express.Router();

router.post('/newOrder/',function(req,res){
    var orderId = req.body.orderId;
    var orderSign = req.body.orderSign;
    if (!orderId && !orderSign){
        console.error('那谁回调缺少ORDERID或ORDERSIGN');
        return res.status(403).send('No orderId or orderSign');
    }
    /*
    setTimeout(function(){
        nashuiOrderService.acceptOrder(orderId,orderSign);
    },100);
    */
    return res.status(200).send('');
});

module.exports = router;