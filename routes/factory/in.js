/**
 * Created by jimmychou on 15/1/27.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('factory_in',req,res)){
        return;
    }
    return res.render('factory/in/index',{
        error:req.query.error,
        info:req.query.info,
        batchcode:req.query.batchcode
    });
});

router.post('/',function(req,res){
    if (!rbaccore.haspermission('factory_in',req,res)){
        return;
    }
    var packagecode = req.body.packagecode;
    var batchcode = req.body.batchcode;
    var labelcode = req.body.labelcode;
    if (!batchcode){
        return res.redirect('/factory/in/?error=无效的入厂批次号');
    }
    if (!packagecode){
        return res.redirect('/factory/in/?error=无效的鞋包装条码&batchcode=' + batchcode);
    }
    if (!labelcode){
        return res.redirect('/factory/in/?error=无效的吊牌标签&batchcode=' + batchcode);
    }
    db.query('select id,orderid,ordinal,totals from t_orders_package where packagecode = ? and status = 0',[packagecode],function(err,result){
        if (err){
            return res.redirect('/factory/in/?error=系统错误&batchcode=' + batchcode);
        }
        if (result.length == 0){
            return res.redirect('/factory/in/?error=没有该条码对应的取鞋记录&batchcode=' + batchcode);
        }
        var id = result[0].id;
        var orderid = result[0].orderid;
        var ordinal = result[0].ordinal;
        var totals = result[0].totals;
        //开始执行入厂事务
        db.getConnection(function(err, connection) {
            if (err){
                console.error('从数据库连接池获取连接失败',err);
                return res.redirect('/factory/in/?error=系统错误&batchcode=' + batchcode);
            }
            connection.beginTransaction(function(err){
                if (err){
                    connection.release();
                    return res.redirect('/factory/in/?error=系统错误&batchcode=' + batchcode);
                }
                async.series([
                    function(update_order){
                        connection.query('update t_orders set status = 3 where id = ?',[orderid],function(err){
                            update_order(err);
                        });
                    },
                    function(insert_progress){
                        connection.query('insert into t_orders_progress (orderid,updatetime,content) values (?,now(),?)',[orderid,'第' + ordinal + '双鞋子开始清洗，共' + totals + '双'],function(err){
                            insert_progress(err);
                        });
                    },
                    function(update_package){
                        connection.query('update t_orders_package set batchcode = ?,labelcode = ?,intime = now(),status = 1 where id = ?',[batchcode,labelcode,id],function(err){
                            update_package(err);
                        })
                    }
                ],function(err){
                    if (err) {
                        console.warn('在数据库工厂确定收鞋时出错回滚',err);
                        return connection.rollback(function(){
                            connection.release();
                            return res.redirect('/factory/in/?error=系统错误&batchcode=' + batchcode);
                        });
                    }
                    return connection.commit(function(err){
                        if (err){
                            return connection.rollback(function(){
                                connection.release();
                                return res.redirect('/factory/in/?error=系统错误&batchcode=' + batchcode);
                            });
                        }
                        connection.release();
                        return res.redirect('/factory/in/?info=已收鞋入厂&batchcode=' + batchcode);
                    });
                });
            });
        });
    });
});

module.exports = router;