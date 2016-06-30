var request = require('request');
var async = require('async');
var debug = true;
var core = require('./core');
var redisClient = require('../../stores/redis');
var apiurl = 'http://gw.api.taobao.com/router/rest';
/*
if (debug){
    apiurl = 'http://gw.api.tbsandbox.com/router/rest';
} else {
    apiurl = 'http://gw.api.taobao.com/router/rest';
}
*/

var apiRequest = function(params,callback){
    core.signParams(params,function(err,requestParams){
        if (err){
            return callback(err);
        }
        request({
            url: apiurl,
            method: 'POST',
            json:true,
            form: requestParams
        },function(err,response,data){
            if (err){
                console.error('请求淘宝开放平台错误',err);
                return callback('请求错误');
            }
            if (response.statusCode != 200){
                console.error('请求淘宝开放平台返回错误',response);
                return callback('返回错误');
            }
            //console.log(data);
            if (data.error_response){
                console.error('请求淘宝平台返回失败',data.error_response.code,data.error_response.msg);
                return callback('返回失败');
            }
            return callback(null,data);
        });
    });
};

var batchQueryOrders = function(starttime,endtime,pageno,taobaoorders,callback){
    if (!starttime){
        return callback('无效的查询开始时间');
    }
    if (!endtime){
        return callback('无效的查询结束时间');
    }
    pageno = pageno || 1;
    taobaoorders = taobaoorders || [];
    var params = {
        method:'taobao.life.order.info.batch.query',
        begin_time:starttime,
        end_time:endtime,
        page_no:pageno,
        service_key:'OnlineLaundry'
    };
    apiRequest(params,function(err,result){
        if(err){
            return callback(err);
        }
        var ordersResult = result.life_order_info_batch_query_response;
        var totalNumers = ordersResult.total_number;
        if (totalNumers == 0){
            return callback(null,taobaoorders);
        }
        var orderLists = ordersResult.order_list.order_d_o;
        if ((!orderLists || orderLists.length == 0) && totalNumers == 1){
            return callback(null,taobaoorders);
        }
        if (orderLists){
            for (var i = 0; i < orderLists.length; i++){
                taobaoorders.push(orderLists[i]);
            }
        }
        if (taobaoorders.length < totalNumers){
            return batchQueryOrders(starttime,endtime,Number(pageno) + 1,taobaoorders,callback);
        } else {
            return callback(null,taobaoorders);
        }
    });
};

var orderAccept = function(taobaoorderid,callback){
    if (!taobaoorderid){
        return callback('无效的淘宝订单号');
    }
    var params = {
        method:'taobao.life.order.accept',
        order_id:taobaoorderid
    };
    apiRequest(params,function(err,result){
        if(err){
            return callback(err);
        }
        //accept_success  是否接单成功
        return callback(null,result.life_order_accept_response);
    });
};

var dispatchWorker = function(taobaoorderid,workerid,callback){
    if (!taobaoorderid){
        return callback('无效的淘宝订单号');
    }
    if (!workerid){
        return callback('无效的服务人员ID');
    }
    var params = {
        method:'taobao.life.worker.dispatch',
        tb_order_id:taobaoorderid,
        worker_ids:workerid
    };
    apiRequest(params,function(err,result){
        if(err){
            return callback(err);
        }
        return callback(null,result.life_worker_dispatch_response);
    });
};

var finishServiceLog = function(taobaoorderid,processid,callback){
    if (!taobaoorderid){
        return callback('无效的淘宝订单号');
    }
    if (!processid){
        return callback('无效的服务过程号');
    }
    var params = {
        method:'taobao.life.order.process.finish',
        order_id:taobaoorderid,
        process_id:processid
    };
    apiRequest(params,function(err,result){
        if(err){
            return callback(err);
        }
        return callback(null,result.life_order_process_finish_response);
    });
};

var startServiceLog = function(taobaoorderid,processid,content,callback){
    if (!taobaoorderid){
        return callback('无效的淘宝订单号');
    }
    if (!processid){
        return callback('无效的服务过程号');
    }
    if (!content){
        return callback('无效的服务过程');
    }
    var params = {
        method:'taobao.life.order.process.log',
        order_id:taobaoorderid,
        process_id:processid,
        content:content
    };
    apiRequest(params,function(err,result){
        if(err){
            return callback(err);
        }
        return callback(null,result.life_order_process_log_response);
    });
};

var getWorkerId = function(callback){
    async.waterfall([
        function(getFromRedis){
            redisClient.get('taobao:worker',function(err,result){
                if (err){
                    console.error('无法从缓存中获取服务人员ID',err);
                    return getFromRedis(null,-1);
                }
                if (!result){
                    return getFromRedis(null,-1);
                }
                return getFromRedis(null,result);
            });
        },
        function(workerId,createFromTop){
            if (workerId > -1){
                return createFromTop(null,workerId);
            }
            createWorker(function(err,result){
                if (err || !result){
                    return createFromTop('创建服务人员错误');
                }
                if (!result.id){
                    return createFromTop('没有有效的服务人员Id');
                }
                workerId = result.id;
                redisClient.set('taobao:worker',workerId,function(){
                    return createFromTop(null,workerId);
                });
            });
        }
    ],function(err,result){
        return callback(err,result);
    });
};

var createWorker = function(callback){
    var workerParams = {
        region_code:1,
        id_card:'888888888888888888',
        worker_education:1,
        job_status:1,
        male:true,
        province_code:1,
        city_code:1,
        birthplace:1,
        avatar_url:'iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAIAAAABc2X6AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABABpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NTc3MiwgMjAxNC8wMS8xMy0xOTo0NDowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ1dWlkOkMxQkNDRTE4NzFCOERCMTE5OTMxOTBGQ0Q1MkI0RTlGIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjZDNjRGQjdBMkRDNjExRTU5QzNDRjJCRUM1ODkwQjUxIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjZDNjRGQjc5MkRDNjExRTU5QzNDRjJCRUM1ODkwQjUxIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIElsbHVzdHJhdG9yIENTNiAoV2luZG93cykiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozMEQ2ODExM0VBQzBFNDExQjdDMENBRkZENEM3NTIyQiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDowQTU0QjVG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',
        name:'e洗鞋',
        job_experience:3,
        contact_mobile:'4008446166',
        contact_address:'广东省深圳市宝安区西乡街道财富港大厦D座5楼'
    };
    var params = {
        method:'taobao.life.worker.create',
        serve_worker:JSON.stringify(workerParams)
    };
    apiRequest(params,function(err,result){
        if(err){
            return callback(err);
        }
        return callback(null,result.life_worker_create_response);
    });
};

var queryServiceLog = function(taobaoorderid,callback){
    if (!taobaoorderid){
        return callback('无效的淘宝订单号');
    }
    var params = {
        method:'taobao.life.order.process.query',
        order_id:taobaoorderid
    };
    apiRequest(params,function(err,result){
        if(err){
            return callback(err);
        }
        return callback(null,result.life_order_process_query_response);
    });
};


exports.batchQueryOrders = batchQueryOrders;
exports.orderAccept = orderAccept;
exports.dispatchWorker = dispatchWorker;
exports.getWorkerId = getWorkerId;
exports.startServiceLog = startServiceLog;
exports.finishServiceLog = finishServiceLog;
exports.queryServiceLog = queryServiceLog;
