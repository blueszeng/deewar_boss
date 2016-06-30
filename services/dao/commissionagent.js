var async = require('async');
var db = require('../db');
var cache = require('../cache');

var agentmoney = 5.0;

var startcommission = function(orderid){
    db.query('select orderid from t_agents_order where orderid = ?',[orderid],function(err,result){
        if (err){
            console.error('尝试分润时获取订单是否分润错误',orderid,err);
            return;
        }
        if (result.length > 0){
            return;
        }
        async.waterfall([
            function(select_order){
                db.query('select zoneid,address from t_orders where id = ?',[orderid],function(err,result){
                    if (err){
                        console.error('在数据库中查询订单错误',orderid,err);
                        return select_order(true);
                    }
                    if (result.length == 0){
                        console.error('无法在数据库中查询到原始订单',orderid);
                        return select_order(true);
                    }
                    var order = result[0];
                    select_order(null,{
                        zoneid:order.zoneid,
                        address:order.address
                    })
                });
            },
            function(orderinfo,select_commission_rule){
                cache.get('villagezone_' + orderinfo.zoneid,function(err,result){
                    if (err){
                        console.error('在缓存中获取代理分润关键字错误',orderid,orderinfo.zoneid,err);
                        return select_commission_rule(true);
                    }
                    if (!result){
                        return select_commission_rule(true);
                    }
                    var object;
                    try{
                        object = JSON.parse(result);
                    }catch (er){
                        console.error('在缓存中获取代理关键字解析错误',er);
                        return select_commission_rule(true);
                    }
                    select_commission_rule(null,{
                        rules:object,
                        address:orderinfo.address
                    });
                });
            },
            function(rule,cacl_commission){
                var address = rule.address;
                var rules = rule.rules;
                if (rules.length == 0){
                    return cacl_commission(true);
                }
                var villagehit = null;
                for (var i = 0;i < rules.length;i++){
                    var village = rules[i];
                    if (address.indexOf(village.vkey) > -1){
                        villagehit = {
                            villageid:village.vid,
                            villagekey:village.vkey
                        };
                        break;
                    }
                }
                if (villagehit == null){
                    return cacl_commission(true);
                }
                cacl_commission(null,{
                    villageid:villagehit.villageid,
                    villagekey:villagehit.villagekey
                });
            },
            function(village,save_commission){
                db.query('insert into t_agents_order (orderid,villageid,villagekey,commission,commissiontime,settled) values (?,?,?,?,now(),0)',[orderid,village.villageid,village.villagekey,agentmoney],function(err){
                    if (err){
                        console.error('在数据库中保存代理分润记录错误',orderid,err);
                        return save_commission(true);
                    }
                    save_commission(null);
                });
            }
        ]);
    });
};

exports.startcommission = startcommission;