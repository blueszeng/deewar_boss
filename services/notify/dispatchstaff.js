var pushdao = require('../dao/push');

var start = function(username,doortime,address){
    var times = doortime - new Date();
    var hours = Math.floor(times/(1000 * 60 * 60));
    pushdao.sendto(username,'新取鞋工单','有' + address + '的' + hours + '小时后取鞋工单',function(err){
        if (err){
            console.error('发送推送通知错误',err);
        }
    });
};

exports.start = start;