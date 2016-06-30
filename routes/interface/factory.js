/**
 * Created by jimmychou on 15/2/1.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var router = express.Router();

router.post('/exist.json',function(req,res){
    var batchcode = req.body.batchcode;
    var labelcode = req.body.labelcode;
    if (!batchcode){
        return res.json({success:false,message:'无效的入厂批次号'});
    }
    if (!labelcode){
        return res.json({success:false,message:'无效的吊牌标签'});
    }
    db.query('select orderid,ordinal,totals from t_orders_package where batchcode = ? and labelcode = ?',[batchcode,labelcode],function(err,result){
        if (err || result.length == 0){
            return res.json({success:false,message:'没有该批次号和吊牌号对应的鞋'});
        }
        var packages = result[0];
        return res.json({success:true,data:{
            orderid:packages.orderid,
            ordinal:packages.ordinal,
            totals:packages.totals
        }});
    });
});

router.post('/shoesinfo.json',function(req,res){
    var batchcode = req.body.batchcode;
    if (!batchcode){
        return res.json({success:false,message:'无效的入厂批次号'});
    }
    var labelcode = req.body.labelcode;
    if (!labelcode){
        return res.json({success:false,message:'无效的吊牌标签'});
    }
    var orderid = req.body.orderid;
    if (!orderid){
        return res.json({success:false,message:'无效的订单号'});
    }
    var ordinal = req.body.ordinal;
    if (!ordinal){
        return res.json({success:false,message:'无效的鞋序号'});
    }
    var totals = req.body.totals;
    if (!totals){
        return res.json({success:false,message:'无效的本单鞋数量'});
    }
    var url = req.body.url;
    if (!url){
        return res.json({success:false,message:'无效的鞋图片地址'});
    }
    var basic_pinpai = req.body.basic_pinpai;
    if (!basic_pinpai){
        return res.json({success:false,message:'无效的鞋品牌信息'});
    }
    var basic_xinghao = req.body.basic_xinghao;
    var basic_leibie = req.body.basic_leibie;
    if (!basic_leibie){
        return res.json({success:false,message:'无效的鞋类别'});
    }
    var basic_shiyong = req.body.basic_shiyong;
    if (!basic_shiyong){
        return res.json({success:false,message:'无效的鞋适用人群'});
    }
    var xiedi_caizhi = req.body.xiedi_caizhi;
    if (!xiedi_caizhi){
        return res.json({success:false,message:'无效的鞋底材质类型'});
    }
    var xiemian_caizhi = req.body.xiemian_caizhi;
    if (!xiemian_caizhi){
        return res.json({success:false,message:'无效的鞋面材质'});
    }
    var xiemian_mashu = req.body.xiemian_mashu;
    if (!xiemian_mashu){
        return res.json({success:false,message:'无效的鞋码数'});
    }
    var xiemian_yanse = req.body.xiemian_yanse;
    if (!xiemian_yanse){
        return res.json({success:false,message:'无效的鞋面颜色'});
    }
    var xiedai_changdu = req.body.xiedai_changdu;
    var xiedai_leixing = req.body.xiedai_leixing;
    if (!xiedai_leixing){
        return res.json({success:false,message:'无效的鞋带类型'});
    }
    var xiedai_yanse = req.body.xiedai_yanse;
    if (!xiedai_yanse){
        return res.json({success:false,message:'无效的鞋带颜色'});
    }
    db.query('insert IGNORE into t_orders_shoes (batchcode,labelcode,orderid,basic_pinpai,basic_xinghao,basic_shiyong,basic_leixing,xiedi_caizhi,xiemian_caizhi,xiemian_mashu,xiemian_yanse,xiedai_leixing,xiedai_changdu,xiedai_yanse,updatetime,ordinal,totals,url) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,now(),?,?,?)',[batchcode,labelcode,orderid,basic_pinpai,basic_xinghao,basic_shiyong,basic_leibie,xiedi_caizhi,xiemian_caizhi,xiemian_mashu,xiemian_yanse,xiedai_leixing,xiedai_changdu,xiedai_yanse,ordinal,totals,url],function(err){
        if (err){
            console.error('查询鞋子品管信息错误',err,batchcode,labelcode);
            return res.json({success:false,message:'系统异常'});
        }
        return res.json({success:true,data:true});
    });
});

router.post('/query.json',function(req,res){
    var batchcode = req.body.batchcode;
    var labelcode = req.body.labelcode;
    if (!batchcode){
        return res.json({success:false,message:'无效的入厂批次号'});
    }
    if (!labelcode){
        return res.json({success:false,message:'无效的吊牌标签'});
    }
    async.waterfall([
        function(select_package){
            db.query('select UNIX_TIMESTAMP(recvtime) recvtime,UNIX_TIMESTAMP(intime) intime,UNIX_TIMESTAMP(outtime) outtime,orderid,status,totals,ordinal,id from t_orders_package where batchcode = ? and labelcode = ?',[batchcode,labelcode],function(err,result){
                if (err || result.length == 0){
                    return select_package('没有该批次号和吊牌号对应的鞋');
                }
                return select_package(null,result[0]);
            });
        },
        function(packageobject,select_order){
            db.query('select quality,UNIX_TIMESTAMP(ordertime) ordertime,date_format(doortime, \'%Y年%m月%d日 %H:%i:%s\') doortime,contact,mobile,address from t_orders where id = ?',[packageobject.orderid],function(err,result){
                if (err || result.length == 0){
                    return select_order('没有该批次号和吊牌号对应的订单信息');
                }
                return select_order(null,{
                    packageinfo:packageobject,
                    orderinfo:result[0]
                });
            });
        },
        function(info,select_getshoes){
            db.query('select UNIX_TIMESTAMP(dispatchtime) dispatchtime,t_staffs.username username,t_staffs.showname showname,t_staffs.mobile mobile from t_orders_getshoes left join t_staffs on t_orders_getshoes.username = t_staffs.username where orderid = ? and finished = 1',[info.packageinfo.orderid],function(err,result){
                if (err || result.length == 0){
                    return select_getshoes('没有该批次号和吊牌号对应的取鞋信息');
                }
                return select_getshoes(null,{
                    packageinfo:info.packageinfo,
                    orderinfo:info.orderinfo,
                    getshoes:result[0]
                });
            });
        },
        function(info,select_returnshoes){
            db.query('select UNIX_TIMESTAMP(dispatchtime) dispatchtime,UNIX_TIMESTAMP(finishtime) finishtime,finished,t_staffs.username username,t_staffs.showname showname,t_staffs.mobile mobile from t_orders_returnshoes left join t_staffs on t_orders_returnshoes.username = t_staffs.username where orderid = ? order by dispatchtime desc limit 1',[info.packageinfo.orderid],function(err,result){
                if (err){
                    return select_returnshoes('系统错误');
                }
                if (result.length == 0){
                    return select_returnshoes(null,{
                        packageinfo:info.packageinfo,
                        orderinfo:info.orderinfo,
                        getshoes:info.getshoes,
                        returnshoes:null
                    });
                }
                return select_returnshoes(null,{
                    packageinfo:info.packageinfo,
                    orderinfo:info.orderinfo,
                    getshoes:info.getshoes,
                    returnshoes:result[0]
                });
            });
        }
    ],function(err,result){
        if (err){
            return res.json({success:false,message:err});
        }
        var info = {
            batchcode:batchcode,
            labelcode:labelcode
        };
        var history = [];
        history.push({
            time:result.orderinfo.ordertime,
            desc:result.orderinfo.contact + '(' + result.orderinfo.mobile + ')下单' + result.orderinfo.quality + '双，预约' + result.orderinfo.doortime + '至' + result.orderinfo.address + '取鞋'
        });
        history.push({
            time:result.getshoes.dispatchtime,
            desc:'调派' + result.getshoes.showname + '(' + result.getshoes.mobile + ')上门取鞋'
        });
        history.push({
            time:result.packageinfo.recvtime,
            desc:'上门取鞋，此鞋为第' + result.packageinfo.ordinal + '双，共' + result.packageinfo.totals + '双'
        });
        history.push({
            time:result.packageinfo.intime,
            desc:'工厂入厂分配批次号[' + batchcode + ']，吊牌号[' + labelcode + ']'
        });
        if (result.packageinfo.status == 2){
            history.push({
                time:result.packageinfo.outtime,
                desc:'工厂清洁完毕出厂'
            });
        }
        if (result.returnshoes){
            history.push({
                time:result.returnshoes.dispatchtime,
                desc:result.returnshoes.showname + '(' + result.returnshoes.mobile + ')接单上门送鞋'
            });
            if (result.returnshoes.finished == 1){
                history.push({
                    time:result.returnshoes.finishtime,
                    desc:'用户收鞋'
                });
            }
        }
        info.history = history;
        return res.json({success:true,data:info});
    });
});

router.post('/infactory.json',function(req,res){
    var packagecode = req.body.packagecode;
    var batchcode = req.body.batchcode;
    var labelcode = req.body.labelcode;
    if (!batchcode){
        return res.json({success:false,message:'无效的入厂批次号'});
    }
    if (!packagecode){
        return res.json({success:false,message:'无效的鞋包装条码'});
    }
    if (!labelcode){
        return res.json({success:false,message:'无效的吊牌标签'});
    }
    db.query('select * from t_orders_package where labelcode = ? and batchcode = ?',[batchcode,Number(labelcode)],function(err,result){
        if (err){
            return res.json({success:false,message:'系统错误'});
        }
        if (result.length > 0){
            return res.json({success:false,message:'已存在该批次号与吊牌号'});
        }
        db.query('select id,orderid,ordinal,totals from t_orders_package where packagecode = ? and status = 0',[packagecode],function(err,result){
            if (err){
                return res.json({success:false,message:'系统错误'});
            }
            if (result.length == 0){
                return res.json({success:false,message:'没有该条码对应的取鞋记录'});
            }
            var id = result[0].id;
            var orderid = result[0].orderid;
            var ordinal = result[0].ordinal;
            var totals = result[0].totals;
            //开始执行入厂事务
            db.getConnection(function(err, connection) {
                if (err){
                    console.error('从数据库连接池获取连接失败',err);
                    return res.json({success:false,message:'系统错误'});
                }
                connection.beginTransaction(function(err){
                    if (err){
                        connection.release();
                        return res.json({success:false,message:'系统错误'});
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
                                return res.json({success:false,message:'系统错误'});
                            });
                        }
                        return connection.commit(function(err){
                            if (err){
                                return connection.rollback(function(){
                                    connection.release();
                                    return res.json({success:false,message:'系统错误'});
                                });
                            }
                            connection.release();
                            return res.json({success:true,data:true});
                        });
                    });
                });
            });
        });
    });
});

router.post('/leavefactory.json',function(req,res){
    var batchcode = req.body.batchcode;
    var labelcode = req.body.labelcode;
    if (!batchcode){
        return res.json({success:false,message:'无效的批次号'});
    }
    if (!labelcode){
        return res.json({success:false,message:'无效的吊牌号'});
    }
    db.query('select t_orders_package.status status,t_orders_package.id id,t_orders_package.ordinal ordinal,t_orders_package.totals totals,t_orders_package.orderid orderid,t_orders.address address,t_orders.contact contact,t_orders.mobile mobile ,t_zones.zone zone from t_orders_package left join t_orders on t_orders_package.orderid = t_orders.id left join t_zones on t_orders.zoneid = t_zones.id where (t_orders_package.status = 1 or t_orders_package.status = 2) and t_orders_package.batchcode = ? and t_orders_package.labelcode = ?',[batchcode,labelcode],function(err,result){
        if (err){
            return res.json({success:false,message:'系统错误'});
        }
        if (result.length == 0){
            return res.json({success:false,message:'没有该吊牌和批次对应的入厂记录'});
        }
        var info = result[0];
        if (info.status == 2){
            //补打
            return res.json({success:true,data:{
                orderid:info.orderid,
                ordinal:info.ordinal,
                totals:info.totals,
                zone:info.zone,
                address:info.address,
                contact:info.contact,
                mobile:info.mobile
            }});
        } else {
            //开始执行出厂事务
            db.getConnection(function(err, connection) {
                if (err){
                    console.error('从数据库连接池获取连接失败',err);
                    return res.json({success:false,message:'系统错误'});
                }
                connection.beginTransaction(function(err){
                    if (err){
                        connection.release();
                        return res.json({success:false,message:'系统错误'});
                    }
                    async.series([
                        function(update_order){
                            connection.query('update t_orders set status = 4 where id = ?',[info.orderid],function(err){
                                update_order(err);
                            });
                        },
                        function(insert_progress){
                            connection.query('insert into t_orders_progress (orderid,updatetime,content) values (?,now(),?)',[info.orderid,'第' + info.ordinal + '双鞋子(共' + info.totals + '双)清洗完毕，发往配送站'],function(err){
                                insert_progress(err);
                            });
                        },
                        function(update_package){
                            connection.query('update t_orders_package set outtime = now(),status = 2 where id = ?',[info.id],function(err){
                                update_package(err);
                            });
                        }
                    ],function(err){
                        if (err) {
                            console.warn('在数据库工厂确定出厂时出错回滚',err);
                            return connection.rollback(function(){
                                connection.release();
                                return res.json({success:false,message:'系统错误'});
                            });
                        }
                        return connection.commit(function(err){
                            if (err){
                                return connection.rollback(function(){
                                    connection.release();
                                    return res.json({success:false,message:'系统错误'});
                                });
                            }
                            connection.release();
                            return res.json({success:true,data:{
                                orderid:info.orderid,
                                ordinal:info.ordinal,
                                totals:info.totals,
                                zone:info.zone,
                                address:info.address,
                                contact:info.contact,
                                mobile:info.mobile
                            }});
                        });
                    });
                });
            });
        }
    });
});

module.exports = router;