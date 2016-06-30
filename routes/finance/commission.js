var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('finance_commission',req,res)){
        return;
    }
    return res.render('finance/commission/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('finance_commission',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'id,requesttime,agentname,commission',
        sFromSql:'(select id,requesttime,agentname,commission from t_finance_commission where settled = 0) commissions',
        sCountColumnName:'commissions.id',
        aoColumnDefs: [
            { mData: 'id', bSearchable: true },
            { mData: 'requesttime', bSearchable: false },
            { mData: 'agentname', bSearchable: true },
            { mData: 'commission', bSearchable: false },
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/deal.html',function(req,res){
    if (!rbaccore.haspermission('finance_commission_deal',req,res)){
        return;
    }
    var id = req.query.id;
    if (!id){
        return res.redirect('/finance/commission/?error=无效的结算单');
    }
    db.query('select * from t_finance_commission left join t_agents on t_finance_commission.agentname = t_agents.username left join t_staffs on t_finance_commission.agentname = t_staffs.username where t_finance_commission.id = ?',[id],function(err,result){
        if (err){
            console.error('在数据库中查询结算单信息异常',err);
            return res.redirect('/finance/commission/?error=无效的结算单');
        }
        if (result.length == 0){
            return res.redirect('/finance/commission/?error=无效的结算单');
        }
        return res.render('finance/commission/deal',{
            commission:result[0]
        });
    });
});

router.post('/deal.html',function(req,res){
    if (!rbaccore.haspermission('finance_commission_deal',req,res)){
        return;
    }
    var staff = req.session.staff;
    var id = req.body.id;
    if (!id){
        return res.redirect('/finance/commission/?error=无效的结算单');
    }
    var settleno = req.body.settleno;
    if (!settleno){
        return res.redirect('/finance/commission/?error=无效的银行流水号');
    }
    var remark = req.body.remark;
    return db.getConnection(function(err,connection){
        if (err){
            console.error('在数据库连接池获取连接失败',err);
            return res.redirect('/finance/commission/?error=结算处理失败');
        }
        return connection.beginTransaction(function(err){
            if (err){
                console.error('数据库开始执行事务失败',err);
                connection.release();
                return res.redirect('/finance/commission/?error=结算处理失败');
            }
            return async.series([
                function(update_commission){
                    connection.query('update t_finance_commission set settled = 1, settletime = now(),settleno = ?,remark = ?,staffname = ? where id = ?',[settleno,remark,staff.username,id],function(err){
                        update_commission(err);
                    });
                },
                function(update_order){
                    connection.query('update t_agents_order set settled = 1,settledtime = now() where settleid = ?',[id],function(err){
                        update_order(err);
                    });
                }
            ],function(err){
                if (err) {
                    console.error('在数据库更新结算单处理时出错回滚',err);
                    return connection.rollback(function(err){
                        if (err){
                            console.error('数据库出错回滚错误',err);
                        }
                        connection.release();
                        return res.redirect('/finance/commission/?error=结算处理失败');
                    });
                }
                return connection.commit(function(err){
                    if (err){
                        console.error('数据库提交失败',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.redirect('/finance/commission/?error=结算处理失败');
                        });
                    }
                    connection.release();
                    return res.redirect('/finance/commission/?info=结算单[' + id + ']处理成功');
                });
            });
        });
    });
});


module.exports = router;