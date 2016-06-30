var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('market_agentnosettled',req,res)){
        return;
    }
    var staff = req.session.staff;
    db.query('select sum(t_agents_order.commission) totals from t_agents_order left join t_agents_village on t_agents_order.villageid = t_agents_village.id where t_agents_village.username = ? and t_agents_order.settled = 0',[staff.username],function(err,result){
        if (err){
            console.error('在数据库查询未结算订单失败',err);
            return res.render('market/agentnosettled/index',{
                nosettled:0,
                info:req.query.info,
                error:req.query.error
            });
        }
        if (result.length == 0){
            return res.render('market/agentnosettled/index',{
                nosettled:0,
                info:req.query.info,
                error:req.query.error
            });
        }
        var totals = Number(result[0].totals);
        return res.render('market/agentnosettled/index',{
            nosettled:totals,
            info:req.query.info,
            error:req.query.error
        });
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('market_agentnosettled',req,res)){
        return;
    }
    var staff = req.session.staff;
    var tabledefinition = {
        sSelectSql:'orders.orderid,t_zones.zone,t_orders.address,orders.villagekey,orders.commission,orders.commissiontime',
        sFromSql:'(select t_agents_order.orderid,t_agents_order.commission,t_agents_order.commissiontime,t_agents_order.villagekey from t_agents_order left join t_agents_village on t_agents_order.villageid = t_agents_village.id where t_agents_village.username = \'' + staff.username + '\' and t_agents_order.settled = 0) orders left join t_orders on orders.orderid = t_orders.id left join t_zones on t_orders.zoneid = t_zones.id',
        sCountColumnName:'agents.username',
        aoColumnDefs: [
            { mData: 'orderid', bSearchable: false },
            { mData: 'zone', bSearchable: false },
            { mData: 'address', bSearchable: false },
            { mData: 'villagekey', bSearchable: false },
            { mData: 'commission', bSearchable: false},
            { mData: 'commissiontime', bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/settle.html',function(req,res){
    if (!rbaccore.haspermission('market_agentnosettled',req,res)){
        return;
    }
    var staff = req.session.staff;
    //判断是否有结算中的订单
    async.waterfall([
        function(check_settling){
            db.query('select count(t_agents_order.orderid) totals from t_agents_order left join t_agents_village on t_agents_order.villageid = t_agents_village.id where t_agents_village.username = ? and t_agents_order.settled = 2',[staff.username],function(err,result){
                if (err){
                    console.error('在数据库查询是否存在正结算订单失败',err);
                    return check_settling('系统异常');
                }
                if (result.length == 0){
                    return check_settling('系统异常');
                }
                var totals = Number(result[0].totals);
                if (totals > 0){
                    return check_settling('存在正在结算中的佣金，请稍候申请结算');
                }
                check_settling(null);
            });
        },
        function(select_nosettled){
            db.query('select t_agents_order.orderid,t_agents_order.commission from t_agents_order left join t_agents_village on t_agents_order.villageid = t_agents_village.id where t_agents_village.username = ? and t_agents_order.settled = 0',[staff.username],function(err,result){
                if (err){
                    console.error('在数据库查询未结算订单失败',err);
                    return select_nosettled('系统异常');
                }
                if (result.length == 0){
                    return select_nosettled('没有任何可以结算佣金的订单');
                }
                var money = 0;
                var orderids = [];
                for (var i = 0;i < result.length;i++){
                    var order = result[i];
                    money += Number(order.commission);
                    orderids.push(order.orderid);
                }
                if (money < 50){
                    return select_nosettled('可结算的佣金总额小于50元，无法结算');
                }
                select_nosettled(null,{
                    commission:money,
                    orderids:orderids
                });
            });
        },
        function(info,update_agentorder){
            db.getConnection(function(err, connection) {
                if (err){
                    console.error('从数据库连接池获取连接失败',err);
                    return update_agentorder('系统错误');
                }
                connection.beginTransaction(function(err){
                    if (err){
                        connection.release();
                        return update_agentorder('系统错误');
                    }
                    async.waterfall([
                        function(insert_finance){
                            connection.query('insert into t_finance_commission (agentname,settled,requesttime,commission) values (?,0,now(),?)',[staff.username,info.commission],function(err,result){
                                if (err){
                                    insert_finance(err);
                                } else {
                                    insert_finance(null,result.insertId);
                                }
                            });
                        },
                        function(settleid,update_agentorder){
                            async.forEachLimit(info.orderids,2,function(item,callback){
                                connection.query('update t_agents_order set settled = 2,settlingtime = now(),settleid = ? where orderid = ?',[settleid,item],function(err){
                                    callback(err);
                                });
                            },function(err){
                                update_agentorder(err);
                            });
                        }
                    ],function(err){
                        if (err) {
                            console.warn('在数据库新增财务佣金结算单时出错回滚',err);
                            return connection.rollback(function(){
                                connection.release();
                                return update_agentorder('系统错误');
                            });
                        }
                        return connection.commit(function(err){
                            if (err){
                                return connection.rollback(function(){
                                    connection.release();
                                    return update_agentorder('系统错误');
                                });
                            }
                            connection.release();
                            return update_agentorder(null,info.commission);
                        });
                    });
                });
            });
        }
    ],function(err,result){
        if (err){
            return res.redirect('/market/agentnosettled/?error=' + err);
        } else {
            return res.redirect('/market/agentnosettled/?info=申请结算佣金' + result + '元成功');
        }
    });
});

module.exports = router;