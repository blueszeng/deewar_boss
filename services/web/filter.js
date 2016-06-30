/**
 * Created by jimmychou on 15/1/7.
 */
var string = require('string');
var db = require('../db');
var requestutil = require('../../utils/request');
exports.init = function(app){
    app.use(function (req, res, next) {
        var url = req.originalUrl;
        var urlobject = string(url);
        if (urlobject.startsWith('/vendor')){
            return next();
        }
        if (urlobject.startsWith('/interface')){
            if (url == '/interface/staff/login.json' || url == '/interface/factory/query.json'){
                return next();
            } else {
                var token = req.body.token;
                if (!token){
                    return res.json({success:false,message:'请重新登录'});
                }
                return db.query('select username from t_staffs_token where token = ?',[token],function(err,result){
                    if (err){
                        console.error('查询物流人员TOKEN错误',err);
                        return res.json({success:false,message:'系统异常，请重试'});
                    }
                    if (result.length == 0){
                        return res.json({success:false,message:'请重新登录'});
                    }
                    req.body.username = result[0].username;
                    return next();
                });
            }
        }
        if (!urlobject.startsWith('/login.html') && !req.session.staff) {
            if (urlobject.startsWith('/#') || url == '/'){
                return res.redirect(`/login.html?error=${encodeURI('访问的内容需要验证您的身份')}`);
            } else {
                return res.redirect(`/login.html?type=ajax&info=${encodeURI('您因长时间没有活动，请重新登录')}`);
            }
        }
        if (!urlobject.startsWith('/login.html') && url != '/' && !urlobject.startsWith('/logout.html')){
            var method = req.method;
            var request = JSON.stringify({
                body:req.body,
                query:req.query
            });
            var username = null;
            var staff = req.session.staff;
            if (staff){
                username = staff.username;
            }
            var ipaddr = requestutil.getclientip(req);
            db.query('insert into t_logs (username,ip,url,method,param,updatetime) values (?,?,?,?,?,now())',[username,ipaddr,url,method,request],function(err){
                if (err){
                    console.error('日志写入出错',err);
                }
            });
        }
        next();
    });
};
