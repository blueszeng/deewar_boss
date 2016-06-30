var moment = require('moment');
var crypto = require('crypto');
var redisClient = require('../../stores/redis');
var debug = true;
var appkey,appsecret;
appkey = '23211248';
appsecret = '620a7737a1c384735b1beb472882df4e';
/*
if (debug){
    appkey = '1023211248';
    appsecret = 'sandbox7a1c384735b1beb472882df4e';
} else {
    appkey = '23211248';
    appsecret = '620a7737a1c384735b1beb472882df4e';
}
*/

var md5Sign = function(prestr){
    prestr = appsecret + prestr + appsecret;
    return crypto.createHash('md5').update(prestr, 'utf8').digest("hex").toUpperCase();
};

var getSessionKey = function(callback){
    return callback(null,'610032407971a292550b5480c2cdc9121bb5ba95bd1d8782490960959');
    /*
    redisClient.get('taobao:session',function(err,result){
        if (err){
            console.error('获取淘宝SESSIONKEY错误',err);
            return callback(err);
        }
        if (!result){
            console.error('淘宝SESSIONKEY已失效');
            return callback('淘宝sessionkey已失效');
        }
        return callback(null,result);
    });
    */
};

var filterParams = function(params){
    var para_filter = {};
    for (var key in params){
        if(key == 'sign' || key == 'sign_type' || params[key] == ''){

        }
        else{
            para_filter[key] = params[key];
        }
    }
    return para_filter;
};

var encodeParams = function(params){
    var para_filter = {};
    for (var key in params){
        para_filter[key] = encodeURIComponent(params[key]);
    }
    return para_filter;
};

var sortParams = function(para){
    var result = {};
    var keys = Object.keys(para).sort();
    for (var i = 0; i < keys.length; i++){
        var k = keys[i];
        result[k] = para[k];
    }
    console.log(result);
    return result;
};

var createLinkstring = function(para){
    var ls = '';
    for(var k in para){
        ls = ls + k + para[k];
    }
    //ls = ls.substring(0, ls.length - 1);
    return ls;
};

var signParams = function(params,callback){
    if (!params.timestamp){
        params.timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    }
    if (!params.format){
        params.format = 'json';
    }
    if (!params.app_key){
        params.app_key = appkey;
    }
    if (!params.v){
        params.v = '2.0';
    }
    if (!params.sign_method){
        params.sign_method = 'md5';
    }
    getSessionKey(function(err,sessionkey){
        if (err){
            return callback(err);
        }
        if (!params.session){
            params.session = sessionkey;
        }
        var filteredParams = filterParams(params);
        var sortedParams = sortParams(filteredParams);
        var signstring = createLinkstring(sortedParams);
        var sign = md5Sign(signstring);
        //var encodedParams = encodeParams(params);
        params.sign = sign;
        return callback(null,params);
    });
};

exports.signParams = signParams;
