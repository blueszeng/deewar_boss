var debug = true;
var db = require('../db');
var async = require('async');
var notify_chargeaccountuser = require('../notify/chargeaccountuser');

exports.chargeaccount = function(userid,orderno,remark,amount,callback){
    db.query('select t_users.wechatid,t_users.wechatactive,t_users_money.balance from t_users left join t_users_money on t_users.id = t_users_money.userid where t_users.id = ?',[userid],function(err,result){
        if (err){
            console.error('在数据库根据用户ID查用户信息错误',err);
            return callback('无效的用户');
        }
        if (result.length == 0){
            return callback('无效的用户');
        }
        var user = result[0];
        async.waterfall([
            function(update_balance){
                var balance = user.balance;
                if (balance || balance === 0){
                    var totalmoney = Number(balance) + Number(amount);
                    db.query('update t_users_money set balance = ?,updatetime = now() where userid = ?',[totalmoney,userid],function(err){
                        return update_balance(err);
                    });
                } else {
                    db.query('insert into t_users_money (userid,balance,updatetime) values (?,?,now())',[userid,amount],function(err){
                        return update_balance(err);
                    });
                }
            },
            function(insert_trade){
                var orderid = Number(orderno.substring(4,10));
                db.query('insert into t_users_trade (userid,tradetime,tradetype,amount,orderid) values (?,now(),?,?,?)',[userid,'充值',amount,orderid],function(err){
                    return insert_trade(err);
                });
            },
            function(sendmessage){
                notify_chargeaccountuser.start(user.wechatid,user.wechatactive,amount,remark,orderno);
                return sendmessage(null);
            }
        ],function(err){
            callback(err);
        });
    });
};