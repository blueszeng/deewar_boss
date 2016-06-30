var debug = true;
var os = require('os');
var request = require('request');
var async = require('async');
var nashuiOrderService = require('./order');
var nashuiConstant = require('./constant');

var exec = function(){

};

var heart = function(){
    async.waterfall([
        function(getToken){
            nashuiOrderService.getAccessToken(function(err,result){
                return getToken(err,result);
            });
        },
        function(token,sendHeart){
            request({
                url: nashuiConstant.getUrlPrefix() + '/heart',
                method: 'POST',
                json:true,
                headers: {
                    'accessToken': token
                }
            },function(err,response){
                if (err){
                    console.error('请求那谁NOP错误',err);
                    return sendHeart('心跳请求错误');
                }
                if (response.statusCode != 200){
                    console.error('请求那谁NOP平台返回错误',response);
                    return sendHeart('心跳请求返回错误');
                }
                return sendHeart(null);
            });
        }
    ],function(err){
        if (err){
            console.error(err);
        }
    });
};

var checktime = function(){
    exec();
    heart();
    setTimeout(checktime,5*60*1000);
};

var schedule = function(){
    console.log('那谁订单处理功能启动');
    checktime();
};

var start = function(){
    if (debug){
        schedule();
    } else {
        var hostname = os.hostname();
        console.info('主机名称：' + hostname);
        if (hostname == 'web_company_1'){
            schedule();
        }
    }
};

exports.start = start;