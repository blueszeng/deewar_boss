/**
 * Created by jimmychou on 15/1/8.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('market_agentprofile',req,res)){
        return;
    }
    var staff = req.session.staff;
    async.waterfall([
        function(select_agents){
            db.query('select * from t_agents left join t_staffs on t_agents.username = t_staffs.username where t_agents.username = ?',[staff.username],function(err,result){
                if (err){
                    console.error('在数据库中查询代理人资料错误',err);
                    return select_agents('系统异常');
                }
                if (result.length == 0){
                    return select_agents('无效的代理人');
                }
                return select_agents(null,result[0]);
            });
        },
        function(agents,select_upstaff){
            db.query('select * from t_staffs where username = ?',[agents.upstaff],function(err,result){
                if (err){
                    console.error('在数据库中查询职员资料错误',err);
                    return select_upstaff('系统异常');
                }
                if (result.length == 0){
                    return select_upstaff('无效的上级营销专员');
                }
                return select_upstaff(null,{
                    agents:agents,
                    upstaff:result[0]
                })
            });
        },
        function(info,select_villages){
            db.query('select t_agents_village.id,t_zones.zone,t_agents_village.address,t_agents_village.households,t_agents_village.villagename,villagekeys.villagekey from t_agents_village left join t_zones on t_agents_village.zoneid = t_zones.id left join (select villageid,GROUP_CONCAT(villagekey) villagekey from t_agents_villagekey group by villageid) villagekeys on t_agents_village.id = villagekeys.villageid where t_agents_village.username = ? order by t_agents_village.id',[staff.username],function(err,result){
                if (err){
                    console.error('在数据库获取代理人小区数据异常',err);
                    return select_villages('系统异常');
                }
                return select_villages(null,{
                    agents:info.agents,
                    upstaff:info.upstaff,
                    villages:result
                });
            });
        },
        function(info,select_commission){
            async.map(info.villages,function(item,callback){
                var villageid = item.id;
                async.parallel({
                    settled:function(callback){
                        db.query('select sum(commission) money from t_agents_order where villageid = ? and settled = 1',[villageid],function(err,result){
                            if (err){
                                console.error('在数据库计算代理人未结算佣金错误',err);
                                return callback(null,0);
                            }
                            if (result.length == 0){
                                return callback(null,0);
                            }
                            return callback(null,result[0].money);
                        })
                    },
                    nosettled:function(callback){
                        db.query('select sum(commission) money from t_agents_order where villageid = ? and settled = 0',[villageid],function(err,result){
                            if (err){
                                console.error('在数据库计算代理人已结算佣金错误',err);
                                return callback(null,0);
                            }
                            if (result.length == 0){
                                return callback(null,0);
                            }
                            return callback(null,result[0].money);
                        })
                    }
                },function(err,results){
                    if (err){
                        callback(null,{
                            villageid:villageid,
                            settled:0,
                            nosettled:0
                        })
                    } else {
                        callback(null,{
                            villageid:villageid,
                            settled:results.settled,
                            nosettled:results.nosettled
                        })
                    }
                });
            },function(err,results){
                if (err){
                    return select_commission('系统异常');
                }
                var settled = 0;
                var nosettled = 0;
                for (var i = 0;i < results.length;i++){
                    settled += Number(results[i].settled);
                    nosettled += Number(results[i].nosettled);
                }
                return select_commission(null,{
                    agents:info.agents,
                    upstaff:info.upstaff,
                    villages:info.villages,
                    commission:{
                        settled:settled,
                        nosettled:nosettled
                    }
                })
            });
        }
    ],function(err,result){
        if (err){
            return res.render('market/agentprofile/index',{
                error:err
            });
        } else {
            return res.render('market/agentprofile/index',result);
        }
    });
});

module.exports = router;