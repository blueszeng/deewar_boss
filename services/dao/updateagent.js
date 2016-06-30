var async = require('async');
var cache = require('../cache');
var db = require('../db');

var updateagent = function(zoneidarray){
    if (zoneidarray.length == 0){
        return;
    }
    async.forEachLimit(zoneidarray,2,function(item,callback){
        cache.delete('villagezone_' + item,function(){
            db.query('select t_agents_villagekey.villagekey vkey,t_agents_village.id vid from t_agents_villagekey left join t_agents_village on t_agents_villagekey.villageid = t_agents_village.id left join t_agents on t_agents_village.username = t_agents.username where t_agents_village.zoneid = ? and t_agents.blocked = 0',[item],function(err,result){
                if (err){
                    console.error('在数据库中获取区域的代理关键字错误',err);
                    return callback(null);
                }
                var string;
                try{
                    string = JSON.stringify(result);
                } catch(er){
                    return callback(err);
                }
                cache.set('villagezone_' + item,string);
                return callback(null);
            });
        });
    },function(err){
        if (err){
            console.error('尝试更新小区代理关键字缓存时错误',zoneidarray,err);
        }
    });
};

var initagent = function(){
    db.query('select id from t_zones where opened = 1',function(err,result){
        if (err){
            console.error('在数据库获取所有已开放的区域错误',err);
            return;
        }
        var zoneidarrays = [];
        for (var i = 0;i < result.length;i++){
            zoneidarrays.push(result[i].id);
        }
        updateagent(zoneidarrays);
    });
};

exports.updateagent = updateagent;
exports.initagent = initagent;


