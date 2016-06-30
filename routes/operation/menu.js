/**
 * Created by jimmychou on 15/2/11.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var rbaccore = require('../../services/rbac/core');
var wechatmenu = require('../../services/wechat/menu');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('operation_menu',req,res)){
        return;
    }
    return res.render('operation/menu/index',{
        menu:wechatmenu.getmenu()
    });
});


router.post('/',function(req,res){
    if (!rbaccore.haspermission('operation_menu',req,res)){
        return;
    }
    var menu = req.body.menu;
    if (!menu){
        return res.render('operation/menu/index',{
            menu:wechatmenu.getmenu(),
            error:'无效的菜单脚本'
        });
    }
    wechatmenu.create(menu,function(err){
        if (err){
            return res.render('operation/menu/index',{
                menu:menu,
                error:err
            });
        } else {
            return res.render('operation/menu/index',{
                menu:menu,
                info:'微信菜单创建成功'
            });
        }
    });
});

module.exports = router;
