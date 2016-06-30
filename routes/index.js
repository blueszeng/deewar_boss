
/**
 * Created by jimmychou on 15/1/7.
 */
var express = require('express');
var db = require('../services/db');
var encodeutil = require('../utils/encode');
var staffrbac = require('../services/rbac/staff');
var configDb = require('../services/dbSeting')
var router = express.Router();

var organizationrouter = require('./organization/index');
var operationrouter = require('./operation/index');
var factoryrouter = require('./factory/index');
var interfacerouter = require('./interface/index');
var websiterouter = require('./website/index');
var userrouter = require('./user/index');
var orderrouter = require('./order/index');
var customrouter = require('./custom/index');
var marketrouter = require('./market/index');
var financerouter = require('./finance/index');
var vendorrouter = require('./vendor/index');
var storerouter = require('./store/index')

var statisticsRouter = require('./statistics/index')
var officialarenaRouter = require('./officialarena/index')
var configurationRouter = require('./configuration/index')
var arenaqueryRouter = require('./arenaquery/index')
var exchangRouter = require('./exchang/index')


router.use('/statistics', statisticsRouter);
router.use('/officialarena', officialarenaRouter);
router.use('/configuration', configurationRouter);
router.use('/arenaquery', arenaqueryRouter);
router.use('/exchang', exchangRouter);


router.use('/store',storerouter);
router.use('/organization',organizationrouter);
router.use('/operation',operationrouter);
router.use('/factory',factoryrouter);
router.use('/interface',interfacerouter);
router.use('/website',websiterouter);
router.use('/user',userrouter);
router.use('/order',orderrouter);
router.use('/custom',customrouter);
router.use('/market',marketrouter);
router.use('/finance',financerouter);
router.use('/vendor',vendorrouter);

router.get('/login.html',function(req,res){
    var type = req.query.type;
    var renderfile = 'login';
    if (type && type == 'ajax'){
        renderfile = 'loginajax';
    }
    res.render(renderfile,{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/login.html',function(req,res){
    var username = req.body.username;
    if (!username){
        return res.render('login',{
            error:'请输入用户名'
        });
    }
    var password = req.body.password;
    if (!password){
        return res.render('login',{
            error:'请输入密码'
        });
    }
    var dbIp = req.body.dbIp;
    if (!dbIp){
      configDb.initDefaultDb()
    } else {
      configDb.setDBconfigIp(dbIp)
    }
    console.log("test", dbIp )
    return db.query('select * from t_staffs where username = ?',[username],function(err,result){
        if (err){
            return res.render('login',{
                error:'系统异常，请重试'
            })
        }
        if (result.length == 0){
            return res.render('login',{
                error:'用户名或密码错误'
            })
        }
        var staff = result[0];
        if (encodeutil.md5(password) != staff.password){
            return res.render('login',{
                error:'用户名或密码错误'
            })
        }
        req.session.staff = staff;
        return res.redirect('/');
    });
});

router.get('/',function(req,res){
    var staff = req.session.staff;
    return staffrbac.getpermissions(staff.username,req,function(results){
        db.query('select * from t_customs where username = ?',[staff.username],function(err,dbresult){
            if (err){
                console.error('在数据库查询客服专员错误',err);
                return res.render('index',{
                    staff:staff,
                    menus:results,
                    "hasChildMenu": function(chunk, context) {
                        var x = context.get('childs');
                        if (!x){
                            return false;
                        }
                        return (x.length > 0);
                    }
                });
            }
            if (dbresult.length == 0){
                return res.render('index',{
                    staff:staff,
                    menus:results,
                    "hasChildMenu": function(chunk, context) {
                        var x = context.get('childs');
                        if (!x){
                            return false;
                        }
                        return (x.length > 0);
                    }
                });
            }
            return res.render('index',{
                staff:staff,
                menus:results,
                custom:dbresult[0],
                agentmobile:staff.mobile,
                "hasChildMenu": function(chunk, context) {
                    var x = context.get('childs');
                    if (!x){
                        return false;
                    }
                    return (x.length > 0);
                }
            });
        });
    });
});

router.get('/logout.html',function(req,res){
    req.session.destroy(function(err){
        if (err){
            console.error('清除SESSION失败',err);
        }
        res.redirect(`/login.html?info=${encodeURI('您已安全退出')}`);
    });
});

router.get('/profile.html',function(req,res){
    var staff = req.session.staff;
    res.render('profile',{
        staff:staff,
        error:req.query.error,
        info:req.query.info
    });
});

router.post('/profile.html',function(req,res){
    var showname = req.body.showname;
    if (!showname){
        return res.redirect('/profile.html?error=无效的姓名');
    }
    var staff = req.session.staff;
    db.query('update t_staffs set showname = ?,mobile = ?,email = ?,remark = ?,updatetime = now() where username = ?',[showname,req.body.mobile,req.body.email,req.body.remark,staff.username],function(err){
        if (err){
            console.error('在数据库修改个人资料失败',err);
            return res.redirect(`/profile.html?error=${encodeURI('修改个人失败')}`);
        }
        return res.redirect(`/profile.html?info=${encodeURI('成功修改个人资料')}`);
    });
});

router.get('/changepwd.html',function(req,res){
    res.render('changepwd',{
        error:req.query.error,
        info:req.query.info
    });
});

router.post('/changepwd.html',function(req,res){
    var oldpassword = req.body.oldpassword;
    if (!oldpassword){
        return res.redirect('/changepwd.html?error=无效的原登录密码');
    }
    var password = req.body.password;
    if (!password){
        return res.redirect('/changepwd.html?error=无效的登录密码');
    }
    var staff = req.session.staff;
    db.query('select * from t_staffs where username = ?',[staff.username],function(err,result){
        if (err){
            return res.redirect('/changepwd.html?error=修改登录密码失败');
        }
        if (result.length == 0){
            return res.redirect('/changepwd.html?error=修改登录密码失败');
        }
        var row = result[0];
        if (encodeutil.md5(oldpassword) != row.password){
            return res.redirect('/changepwd.html?error=原登录密码错误');
        }
        if (oldpassword == password){
            return res.redirect('/changepwd.html?error=新旧密码不能相同');
        }
        db.query('update t_staffs set password = ? where username = ?',[encodeutil.md5(password),staff.username],function(err){
            if (err){
                return res.redirect('/changepwd.html?error=修改登录密码失败');
            }
            return res.redirect('/login.html?type=ajax&info=您已成功修改登录密码，请重新登录');
        });
    });
});

router.get('/dashboard.html',function(req,res){
    db.query('select * from t_boards order by updatetime desc limit 10',function(err,result){
        return res.render('dashboard',{
            board:result
        });
    });
});

module.exports = router;
