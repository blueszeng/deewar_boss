var express = require('express');
var db = require('../../services/db');
var async = require('async');
var router = express.Router();

router.post('/comments.json',function(req,res){
    var orderid = req.body.orderid;
    if (!orderid){
        return res.json({success:false,message:'无效的订单号'});
    }
    db.query('select UNIX_TIMESTAMP(updatetime) updatetime,id,orderid,commentname,commentmobile,commentrole,comment from t_orders_comment where orderid = ?',[orderid],function(err,result){
        if (err){
            console.error('查询订单所有备注信息错误',err);
            return res.json({success:false,message:'系统错误，请重试'});
        }
        return res.json({success:true,data:result});
    });
});

router.post('/comment.json',function(req,res){
    var orderid = req.body.orderid;
    if (!orderid){
        return res.json({success:false,message:'无效的订单号'});
    }
    var comment = req.body.comment;
    if (!comment){
        return res.json({success:false,message:'无效的订单备注信息'});
    }
    var username = req.body.username;
    async.waterfall([
        function(get_staff){
            db.query('select showname,mobile from t_staffs where username = ?',[username],function(err,result){
                if (err){
                    console.error('在数据库查询职员名字和电话错误',err);
                    return get_staff('系统异常');
                } else {
                    if (result.length == 0){
                        return get_staff('无效的用户信息');
                    } else {
                        return get_staff(null,result[0]);
                    }
                }
            });
        },
        function(staff,insert_comment){
            db.query('insert into t_orders_comment (orderid,updatetime,commentname,commentrole,commentmobile,comment) values (?,now(),?,?,?,?)',[orderid,staff.showname,'客服',staff.mobile,comment],function(err){
                if (err){
                    console.error('插入订单备注信息异常',err);
                    return insert_comment('系统异常');
                }
                return insert_comment(null);
            });
        }
    ],function(err){
        if (err){
            return res.json({success:false,message:err});
        }
        return res.json({success:true,data:true});
    });
});

router.post('/factory.json',function(req,res){
    var orderid = req.body.orderid;
    if (!orderid){
        return res.json({success:false,message:'无效的订单号'});
    }
    db.query('select id,status,packagecode,UNIX_TIMESTAMP(recvtime) recvtime,batchcode,labelcode, UNIX_TIMESTAMP(intime) intime,UNIX_TIMESTAMP(outtime) outtime,ordinal,totals from t_orders_package where orderid = ? order by ordinal',[orderid],function(err,result){
        if (err){
            console.error('查询订单工厂信息错误',err);
            return res.json({success:false,message:'系统错误，请重试'});
        }
        return res.json({success:true,data:result});
    });
});


module.exports = router;