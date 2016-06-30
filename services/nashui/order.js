var async = require('async');
var request = require('request');
var redisClient = require('../../stores/redis');
var nashuiConstant = require('./constant');

var getAccessToken = function(callback){
    async.waterfall([
        function(getFromRedis){
            redisClient.get('nashui:token',function(err,result){
                if (err){
                    return getFromRedis(null,false);
                }
                if (!result){
                    return getFromRedis(null,false);
                }
                return getFromRedis(null,result);
            });
        },
        function(token,getFromNOP){
            if (token){
                return getFromNOP(null,token,false);
            }
            request({
                url: nashuiConstant.getUrlPrefix() + '/token?appKey=' + nashuiConstant.getAppKey() + '&appSecret=' + nashuiConstant.getAppSecret(),
                method: 'GET',
                json:true,
                strictSSL:false,
                rejectUnauthorized:false
            },function(err,response,data){
                if (err){
                    console.error('请求那谁NOP错误',err);
                    return getFromNOP('请求那谁NOP错误');
                }
                if (response.statusCode != 200){
                    console.error('请求那谁NOP平台返回错误',response);
                    return getFromNOP('请求那谁NOP平台返回错误');
                }
                if (!data.access_token){
                    console.error('请求那谁NOP平台返回失败',data.errMsg);
                    return getFromNOP('TOKEN获取返回失败');
                }
                return getFromNOP(null,data.access_token,true);
            });
        },
        function(token,needWrite,writeTokenToRedis){
            if (needWrite){
                redisClient.setex('nashui:token',7100,token);
            }
            return writeTokenToRedis(null,token);
        }
    ],function(err,result){
        return callback(err,result);
    });
};

var acceptOrder = function(orderId,orderSign){
    async.waterfall([
        function(getToken){
            getAccessToken(function(err,result){
                return getToken(err,result);
            });
        },
        function(token,responseAck){
            request({
                url: nashuiConstant.getUrlPrefix() + '/order/' + orderId + '/ack',
                method: 'POST',
                json:true,
                rejectUnauthorized:false,
                headers: {
                    'accessToken': token
                },
                form: {
                    orderSign:orderSign
                }
            },function(err,response,data){
                if (err){
                    console.error('请求那谁NOP错误',err);
                    return responseAck('订单确认请求错误');
                }
                if (response.statusCode != 200){
                    console.error('请求那谁NOP平台返回错误',response);
                    return responseAck('订单确认返回错误');
                }
                console.log(data);
                if (!data.success){
                    console.error('请求那谁NOP平台返回失败',data.errMsg);
                    return responseAck('订单确认返回失败');
                }
                return responseAck(null,token);
            });
        },
        function(token,getOrderDetail){
            request({
                url: nashuiConstant.getUrlPrefix() + '/order/' + orderId,
                method: 'GET',
                json:true,
                rejectUnauthorized:false,
                headers: {
                    'accessToken': token
                }
            },function(err,response,data){
                if (err){
                    console.error('请求那谁NOP错误',err);
                    return getOrderDetail('订单详情请求错误');
                }
                if (response.statusCode != 200){
                    console.error('请求那谁NOP平台返回错误',response);
                    return getOrderDetail('订单详情返回错误');
                }
                console.log(data);
                if (!data.success){
                    console.error('请求那谁NOP平台返回失败',data.errMsg);
                    return getOrderDetail('订单详情返回失败');
                }
                return getOrderDetail(null,data);
            });
        }
    ],function(err){
        if (err){
            console.error(err);
        }
    });
};

module.exports.acceptOrder = acceptOrder;
module.exports.getAccessToken = getAccessToken;
