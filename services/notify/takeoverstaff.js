var pushdao = require('../dao/push');

var start = function(username,doortime,address){
    var times = doortime - new Date();
    var hours = Math.floor(times/(1000 * 60 * 60));
    pushdao.sendto(username,'取消取鞋工单','原定' + hours + '小时后到' + address + '的取鞋工单被其他同事接管',function(err){
        if (err){
            console.error('发送接管取鞋工单消息错误',err);
        }
    });
};

exports.start = start;