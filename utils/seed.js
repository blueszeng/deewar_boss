var db = require('../services/db');

function getseedcode12(callback){
    var data=["0","1","2","3","4","5","6","7","8","9"];
    var result="";
    for(var i=0;i<12;i++){ //产生20位就使i<20
        var r=Math.floor(Math.random()*10); //16为数组里面数据的数量，目的是以此当下标取数组data里的值！
        result = result + String(data[r]); //输出20次随机数的同时，让rrr加20次，就是20位的随机字符串了。
    }
    db.query('insert into t_seeds (id) values (?)',[result],function(err){
        if (err){
            getseedcode12(callback);
        } else {
            callback(result);
        }
    });
}

exports.getseedcode12 = getseedcode12;