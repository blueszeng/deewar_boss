var express = require('express');
var db = require('../../services/db');
var async = require('async');
var rbaccore = require('../../services/rbac/core');
var numberutils = require('../../utils/number');
var dispatchcoupon = require('../../services/coupon/dispatch');
var chargeaccount = require('../../services/account/charge');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('custom_query',req,res)){
        return;
    }
    return res.render('custom/query/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/search.html',function(req,res){
    if (!rbaccore.haspermission('custom_query',req,res)){
        return;
    }
    var type = req.body.type;
    if (!type){
        return res.render('custom/query/index',{
            error:'无效的查询方式'
        });
    }
    var key = req.body.key;
    if (!key){
        return res.render('custom/query/index',{
            error:'无效的查询内容'
        });
    }
    if (Number(type) == 4){
        if (!req.body.key2){
            return res.render('custom/query/index',{
                error:'无效的查询内容'
            });
        }
    }
    var sql,array;
    switch(Number(type)){
        case 0:
            sql = 'select id as userid from t_users where wechatid = ? limit 1';
            array = [key];
            break;
        case 1:
            sql = 'select userid from t_orders where mobile = ? limit 1';
            array = [key];
            break;
        case 2:
            sql = 'select userid from t_orders where id = ? limit 1';
            if (key.length == 14){
                array = [Number(key.substring(4,10))];
            } else {
                array = [key];
            }
            break;
        case 3:
            sql = 'select t_orders.userid userid from t_orders_package left join t_orders on t_orders_package.orderid = t_orders.id where t_orders_package.packagecode = ? limit 1';
            array = [key];
            break;
        case 4:
            sql = 'select t_orders.userid userid from t_orders_package left join t_orders on t_orders_package.orderid = t_orders.id where t_orders_package.batchcode = ? and t_orders_package.labelcode = ? limit 1';
            array = [key,req.body.key2];
            break;
        case 5:
            sql = 'select id as userid from t_users where taobaoname = ? limit 1';
            array = [key];
            break;
    }
    if (!(sql && array)){
        return res.render('custom/query/index',{
            error:'无效的查询方式'
        });
    }
    db.query(sql,array,function(err,result){
        if (err){
            console.error('客服查询错误',err);
            return res.render('custom/query/index',{
                error:'系统发生异常'
            });
        }
        if (result.length == 0){
            return res.render('custom/query/index',{
                error:'没有查询到相关数据'
            });
        }
        if (Number(type) == 4){
            return res.redirect('/custom/query/info.html?userid=' + result[0].userid + '&type=4&key=' + key + '_' + req.query.key2);
        } else {
            return res.redirect('/custom/query/info.html?userid=' + result[0].userid + '&type=' + type + '&key=' + key);
        }
    });
});


router.get('/info.html',function(req,res){
    if (!rbaccore.haspermission(['custom_query','custom_nashui','user_list_detail','user_today_detail','user_coupon_detail'],req,res)){
        return;
    }
    var userid = req.query.userid;
    if (!userid){
        return res.render('custom/query/index',{
            error:'没有查询到相关数据'
        });
    }
    var tip,refresh,backurl;
    var source = req.query.source;
    if (source){
        tip = '用户详情';
        refresh = '/custom/query/info.html?userid=' + userid + '&source=' + source + '';
        backurl = source;
    } else {
        var type = req.query.type;
        if (!type){
            return res.render('custom/query/index',{
                error:'无效的查询方式'
            });
        }
        var key = req.query.key;
        if (!key){
            return res.render('custom/query/index',{
                error:'无效的查询内容'
            });
        }
        refresh = '/custom/query/info.html?userid=' + userid + '&type=' + type + '&key=' + key;
        backurl = '/custom/query/';
        switch(Number(type)){
            case 0:
                tip = '微信ID：' + key;
                break;
            case 1:
                tip = '下单电话：' + key;
                break;
            case 2:
                tip = '订单号：' + key;
                break;
            case 3:
                tip = '入厂包装条码：' + key;
                break;
            case 4:
                tip = '清洗批次和吊牌：' + key;
                break;
            case 5:
                tip = '淘宝用户名：' + key;
                break;
            default:
                tip = '';
                break;
        }
    }
    async.parallelLimit({
        profile:function(callback){
            db.query('select *,t_users_profile.updatetime profiletime,t_users_money.updatetime moneytime from t_users left join t_users_profile on t_users.id = t_users_profile.userid left join t_users_money on t_users.id = t_users_money.userid where t_users.id = ?',[userid],function(err,result){
                if (err){
                    return callback(err);
                }
                if (result.length == 0){
                    return callback('无法查询到用户资料');
                }
                return callback(null,result[0]);
            });
        },
        orders:function(callback){
            db.query('select t_orders.*,t_cities.city city,t_districts.district district,t_zones.zone zone from t_orders left join t_cities on t_orders.cityid = t_cities.id left join t_districts on t_orders.districtid = t_districts.id left join t_zones on t_orders.zoneid = t_zones.id where userid = ? order by ordertime desc',[userid],function(err,result){
                if (err){
                    return callback(err);
                }
                for (var i = 0;i < result.length;i++){
                    result[i].orderno = numberutils.paddingLeft(String(result[i].cityid),4) + numberutils.paddingLeft(String(result[i].id),6) + numberutils.paddingLeft(String(result[i].ordertime.getSeconds() * result[i].ordertime.getMinutes()),4);
                    if (Number(result[i].status) > 0){
                        result[i].onlinepay = result[i].price - result[i].balanceuse - result[i].couponmoney;
                    } else {
                        result[i].onlinepay = 0;
                    }
                }
                return callback(null,result);
            });
        },
        coupons:function(callback){
            db.query('select *,t_users_coupon.status couponstatus,UNIX_TIMESTAMP(t_users_coupon.gettime) gettimeunix from t_users_coupon left join t_coupons on t_users_coupon.couponid = t_coupons.id where userid = ? order by gettime desc',[userid],function(err,result){
                if (err){
                    return callback(err);
                }
                var now = (new Date()).getTime();
                for (var i = 0;i < result.length;i++){
                    var coupon = result[i];
                    if (coupon.couponstatus == 4){
                        result[i].statusstring = '已过期';
                        result[i].statusicon = 'warning';
                    } else if (coupon.couponstatus == 3){
                        result[i].statusstring = '已删除';
                        result[i].statusicon = 'primary';
                    } else if (coupon.couponstatus == 2){
                        result[i].statusstring = '已赠送';
                        result[i].statusicon = 'primary';
                    } else if (coupon.couponstatus == 1){
                        result[i].statusstring = '已使用';
                        result[i].statusicon = 'default';
                    } else if (coupon.couponstatus == 0){
                        if ((Number(coupon.gettimeunix * 1000) + (86400000 * coupon.expiredate)) > now){
                            result[i].statusstring = '有效中';
                            result[i].statusicon = 'success';
                        } else {
                            result[i].statusstring = '已过期';
                            result[i].statusicon = 'warning';
                        }
                    }
                }
                return callback(null,result);
            });
        },
        addresses:function(callback){
            db.query('select t_users_address.*,t_cities.city city,t_districts.district district,t_zones.zone zone from t_users_address left join t_cities on t_users_address.cityid = t_cities.id left join t_districts on t_users_address.districtid = t_districts.id left join t_zones on t_users_address.zoneid = t_zones.id where t_users_address.userid = ? order by id desc',[userid],function(err,result){
                if (err){
                    return callback(err);
                }
                return callback(null,result);
            });
        },
        trades:function(callback){
            db.query('select * from t_users_trade where userid = ? order by id desc',[userid],function(err,result){
                if (err){
                    return callback(err);
                }
                return callback(null,result);
            });
        }
    },3,function(err,result){
        if (err){
            console.error('客服数据查询异常',err);
            return res.render('custom/query/index',{
                error:'系统异常，查询数据出错'
            });
        }
        return res.render('custom/query/info',{
            query:{
                userid:userid,
                refresh:refresh,
                backurl:backurl
            },
            subtitle:tip,
            userinfo:result,
            size:{
                address:result.addresses.length,
                order:result.orders.length,
                trade:result.trades.length,
                coupon:result.coupons.length
            }
        });
    });
});

router.get('/charge.html',function(req,res){
    if (!rbaccore.haspermission(['custom_query','user_list_detail','user_today_detail'],req,res)){
        return;
    }
    var userid = req.query.userid;
    if (!userid){
        return res.render('custom/query/charge',{
            error:'无效的用户ID'
        })
    }
    return res.render('custom/query/charge',{
        userid:userid
    });
});

router.get('/coupon.html',function(req,res){
    if (!rbaccore.haspermission(['custom_query','user_list_detail','user_today_detail','user_coupon_detail'],req,res)){
        return;
    }
    var userid = req.query.userid;
    if (!userid){
        return res.render('custom/query/coupon',{
            error:'无效的用户ID'
        })
    }
    db.query('select * from t_coupons where cardtype = 0 and status = 1 order by id desc',function(err,result){
        if (err){
            console.error('在数据库获取所有优惠券类型异常',err);
        }
        return res.render('custom/query/coupon',{
            userid:userid,
            coupons:result
        });
    });
});

router.post('/charge.html',function(req,res){
    if (!rbaccore.haspermission(['custom_query','user_list_detail','user_today_detail'],req,res)){
        return;
    }
    var userid = req.body.userid;
    if (!userid){
        return res.json({success:false,message:'无效的用户'});
    }
    var orderno = req.body.orderno;
    if (!orderno){
        return res.json({success:false,message:'无效的订单号'});
    }
    if (orderno.length != 14){
        return res.json({success:false,message:'订单号长度错误'});
    }
    var remark = req.body.remark;
    if (!remark){
        return res.json({success:false,message:'无效的赠送留言'});
    }
    var amount = req.body.amount;
    if (!amount){
        return res.json({success:false,message:'无效的返现金额'});
    }
    if (Number(amount) > 500){
        return res.json({success:false,message:'返现金额太大需审批'});
    }
    chargeaccount.chargeaccount(userid,orderno,remark,amount,function(err){
        if (err){
            return res.json({success:false,message:err});
        } else {
            return res.json({success:true,data:true});
        }
    });
});

router.post('/coupon.html',function(req,res){
    if (!rbaccore.haspermissionjson(['custom_query','user_list_detail','user_today_detail','user_coupon_detail'],req,res)){
        return;
    }
    var userid = req.body.userid;
    if (!userid){
        return res.json({success:false,message:'无效的用户'});
    }
    var couponid = req.body.couponid;
    if (!couponid){
        return res.json({success:false,message:'无效的优惠券'});
    }
    var remark = req.body.remark;
    if (!remark){
        return res.json({success:false,message:'无效的赠送留言'});
    }
    dispatchcoupon.dispatchcoupon(userid,couponid,remark,function(err){
        if (err){
            return res.json({success:false,message:err});
        } else {
            return res.json({success:true,data:true});
        }
    });
});

router.get('/comment.html',function(req,res){
    if (!rbaccore.haspermission(['custom_query','custom_nashui','order_list_comment','order_expirein_comment','order_expireout_comment'],req,res)){
        return;
    }
    var orderid = req.query.orderid;
    if (!orderid){
        return res.render('custom/query/comment',{
            error:'无效的订单ID'
        })
    }
    var staff = req.session.staff;
    db.query('select * from t_orders_comment where orderid = ? order by id',[orderid],function(err,result){
        if (err){
            console.error('在数据库获取订单备注异常',err);
        }
        return res.render('custom/query/comment',{
            orderid:orderid,
            comments:result,
            me:staff.showname
        });
    });
});

router.post('/comment.html',function(req,res){
    if (!rbaccore.haspermissionjson(['custom_query','custom_nashui','order_list_comment','order_expirein_comment','order_expireout_comment'],req,res)){
        return;
    }
    var orderid = req.body.orderid;
    if (!orderid){
        return res.json({success:false,message:'无效的订单号'});
    }
    var comment = req.body.comment;
    if (!comment){
        return res.json({success:false,message:'无效的备注信息'});
    }
    var staff = req.session.staff;
    if (!staff){
        return res.json({success:false,message:'无效的用户'});
    }
    db.query('insert into t_orders_comment (orderid,updatetime,commentname,commentrole,commentmobile,comment) values (?,now(),?,?,?,?)',[orderid,staff.showname,'客服',staff.mobile,comment],function(err){
        if (err){
            console.error('插入订单备注信息异常',err);
            return res.json({success:false,message:'系统异常'});
        }
        return res.json({success:true,data:true});
    });
});


module.exports = router;