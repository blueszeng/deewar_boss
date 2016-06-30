/**
 * Created by jimmychou on 15/6/22.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var encodeutil = require('../../utils/encode');
var updateagentdao = require('../../services/dao/updateagent');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('market_agentall',req,res)){
        return;
    }
    return res.render('market/agentall/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('market_agentall',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'agents.upstaff upstaff,agents.username username,t_staffs.showname showname,t_staffs.mobile mobile,villages.village,agents.updatetime updatetime,agents.createtime createtime',
        sFromSql:'t_agents agents left join t_staffs on agents.username = t_staffs.username left join (select t_agents_village.username,GROUP_CONCAT(CONCAT(t_agents_village.villagename,\'(\',t_zones.zone,\')\')) village from t_agents_village left join t_zones on t_agents_village.zoneid = t_zones.id group by t_agents_village.username) villages on villages.username = agents.username',
        sCountColumnName:'agents.username',
        aoColumnDefs: [
            { mData: 'username', bSearchable: true },
            { mData: 'showname', bSearchable: true },
            { mData: 'mobile', bSearchable: true },
            { mData: 'village', bSearchable: false },
            { mData: 'upstaff', bSearchable: true },
            { mData: 'updatetime', bSearchable: false},
            { mData: 'createtime', bSearchable: false},
            { mData: null, bSearchable: false},
            { mData: 'agents.username', bSearchable: true }
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('market_agentall_add',req,res)){
        return;
    }
    db.query('select t_zones.id,t_zones.zone,t_districts.district from t_zones left join t_districts on t_zones.districtid = t_districts.id where t_zones.opened = 1 order by t_zones.districtid',function(err,result){
        if (err){
            console.error('在数据库获取所有营销区域失败',err);
            return res.redirect('/market/agentall/?error=错误的营销专员配置');
        }
        return res.render('market/agentall/add',{
            zones:JSON.stringify(result),
            error:req.query.error
        });
    });
});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('market_agentall_add',req,res)){
        return;
    }
    var username = req.body.username;
    if (!username){
        return res.redirect('/market/agentall/add.html?error=无效的账户名');
    }
    var showname = req.body.showname;
    if (!username){
        return res.redirect('/market/agentall/add.html?error=无效的姓名');
    }
    var password = req.body.password;
    if (!password){
        return res.redirect('/market/agentall/add.html?error=无效的登录密码');
    }
    var mobile = req.body.mobile;
    if (!mobile){
        return res.redirect('/market/agentall/add.html?error=无效的手机号码');
    }
    var staffname = req.body.staffname;
    if (!staffname){
        return res.redirect('/market/agentall/add.html?error=无效的上级营销专员');
    }
    var zone = req.body.zone;
    if (!zone){
        return res.redirect('/market/agentall/add.html?error=无效的代理区域');
    }
    var idcard = req.body.idcard;
    if (!idcard){
        return res.redirect('/market/agentall/add.html?error=无效的代理人身份证号码');
    }
    var bankname = req.body.bankname;
    var bankuser = req.body.bankuser;
    var bankno = req.body.bankno;
    //切开小区关键字
    var villageobjects = JSON.parse(zone);
    async.series([
        function(checkusername){
            db.query('select username from t_staffs where username = ?',[username],function(err,result){
                if (err){
                    console.error('在数据库查询用户名是否重复错误',err);
                    return checkusername('新增代理人失败');
                }
                if (result.length > 0){
                    return checkusername('已经存在的用户名');
                }
                return checkusername(null);
            });
        },
        function(checkvillagekey){
            async.every(villageobjects,function(item,callback){
                var zoneid = item[9];
                var keys = [];
                if (item[4] != ''){
                    keys.push(item[4]);
                }
                if (item[5] != ''){
                    keys.push(item[5]);
                }
                if (item[6] != ''){
                    keys.push(item[6]);
                }
                async.every(keys,function(item,callback){
                    db.query('select t_agents_villagekey.id from t_agents_villagekey left join t_agents_village on t_agents_villagekey.villageid = t_agents_village.id where t_agents_village.zoneid = ? and t_agents_villagekey.villagekey like \'%' + item + '%\'',[zoneid],function(err,result){
                        if (err){
                            console.error('在数据库中执行查询小区关键字是否存在错误',err);
                            return callback(false);
                        }
                        if (result.length > 0){
                            return callback(false);
                        }
                        return callback(true);
                    });
                },function(result){
                    callback(result);
                });
            },function(result){
                if (result != true){
                    return checkvillagekey('已经存在的代理小区关键字');
                } else {
                    return checkvillagekey(null);
                }
            });
        }
    ],function(err){
        if (err){
            return res.redirect('/market/agentall/add.html?error=' + err);
        }
        return db.getConnection(function(err,connection){
            if (err){
                console.error('在数据库连接池获取连接失败',err);
                return res.redirect('/market/agentall/add.html?error=新增代理人失败');
            }
            return connection.beginTransaction(function(err){
                if (err){
                    console.error('数据库开始执行事务失败',err);
                    connection.release();
                    return res.redirect('/market/agentall/add.html?error=新增代理人失败');
                }
                return async.series([
                    function(insert_staff){
                        connection.query('insert into t_staffs (username,showname,password,mobile,remark,updatetime) values (?,?,?,?,?,now())',[username,showname,encodeutil.md5(password),mobile,'代理人'],function(err){
                            insert_staff(err);
                        });
                    },
                    function(insert_roles){
                        connection.query('insert into t_staffs_role (username,rolename) values (?,?)',[username,'代理人'],function(err){
                            insert_roles(err);
                        });
                    },
                    function(insert_agents){
                        connection.query('insert into t_agents (username,idcard,bankname,bankuser,bankno,upstaff,updatetime,blocked,createtime) values (?,?,?,?,?,?,now(),0,now())',[username,idcard,bankname,bankuser,bankno,staffname],function(err){
                            insert_agents(err);
                        });
                    },
                    function(insert_villages){
                        async.forEach(villageobjects,function(item,callback){
                            connection.query('insert into t_agents_village (username,zoneid,address,villagename,households,updatetime) values (?,?,?,?,?,now())',[username,item[9],item[2],item[1],item[3]],function(err,result){
                                if (err){
                                    console.error('在数据库插入代理人小区信息错误',err);
                                    return callback(err);
                                }
                                var villageid = result.insertId;
                                var keys = [];
                                if (item[4] != ''){
                                    keys.push(item[4]);
                                }
                                if (item[5] != ''){
                                    keys.push(item[5]);
                                }
                                if (item[6] != ''){
                                    keys.push(item[6]);
                                }
                                async.forEach(keys,function(item,callback){
                                    connection.query('insert into t_agents_villagekey (villageid,villagekey,updatetime) values (?,?,now())',[villageid,item],function(err){
                                        if (err){
                                            console.error('在数据库插入小区关键字信息错误',err);
                                        }
                                        callback(err);
                                    });
                                },function(err){
                                    callback(err);
                                })
                            });
                        },function(err){
                            insert_villages(err);
                        });
                    }
                ],function(err){
                    if (err) {
                        console.error('在数据库插入新的代理人时出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.redirect('/market/agentall/add.html?error=新增代理人失败');
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
                                return res.redirect('/market/agentall/add.html?error=新增代理人失败');
                            });
                        }
                        connection.release();
                        var zoneidarray = [];
                        for (var i = 0;i < villageobjects.length;i++){
                            var village = villageobjects[i];
                            var zoneid = Number(village[9]);
                            if (zoneidarray.indexOf(zoneid) == -1){
                                zoneidarray.push(zoneid);
                            }
                        }
                        updateagentdao.updateagent(zoneidarray);
                        return res.redirect('/market/agentall/?info=新增代理人' + showname + '成功');
                    });
                });
            });
        });
    });
});

router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('market_agentall_edit',req,res)){
        return;
    }
    var username = req.query.username;
    if (!username){
        return res.redirect('/market/agentall/?error=无法编辑代理人资料');
    }
    return async.parallel({
        staff:function(callback){
            db.query('select * from t_staffs where username = ?',[username],function(err,result){
                if (err){
                    return callback(err);
                }
                if (result.length == 0){
                    return callback('无法找到用户');
                }
                return callback(null,result[0]);
            });
        },
        agents:function(callback){
            db.query('select * from t_agents where username = ?',[username],function(err,result){
                if (err){
                    return callback(err);
                }
                if (result.length == 0){
                    return callback('无法找到代理人');
                }
                return callback(null,result[0]);
            });
        },
        zones:function(callback){
            db.query('select t_zones.id,t_zones.zone,t_districts.district from t_zones left join t_districts on t_zones.districtid = t_districts.id where t_zones.opened = 1 order by t_zones.districtid',function(err,result){
                if (err){
                    return callback(err);
                }
                return callback(null,result);
            });
        },
        villages:function(callback){
            db.query('select t_agents_village.id,t_zones.zone,t_zones.id zoneid,t_agents_village.villagename,t_agents_village.address,t_agents_village.households from t_agents_village left join t_zones on t_agents_village.zoneid = t_zones.id where username = ?',[username],function(err,vresult){
                if (err){
                    return callback(err);
                }
                async.map(vresult,function(item,callback){
                    db.query('select * from t_agents_villagekey where villageid = ?',[item.id],function(err,result){
                        if (err){
                            return callback(err);
                        }
                        var object = [];
                        object.push(item.zone);
                        object.push(item.villagename);
                        object.push(item.address);
                        object.push(item.households);
                        if (result.length > 0){
                            object.push(result[0].villagekey);
                        } else {
                            object.push('');
                        }
                        if (result.length > 1){
                            object.push(result[1].villagekey);
                        } else {
                            object.push('');
                        }
                        if (result.length > 2){
                            object.push(result[2].villagekey);
                        } else {
                            object.push('');
                        }
                        object.push('');
                        object.push('<a class="delete" href="">删除</a>');
                        object.push(item.zoneid);
                        callback(null,object);
                    });
                },function(err,results){
                    callback(err,results);
                });
            });
        }
    },function(err,results){
        if (err){
            console.error('在数据库查找代理人失败',err);
            return res.redirect('/market/agentall/?error=无法编辑代理人' + username);
        }
        var villages = results.villages;
        var oldzoneids = [];
        for (var i = 0;i < villages.length;i++){
            var village = villages[i];
            var zoneid = Number(village[9]);
            if (oldzoneids.indexOf(zoneid) == -1){
                oldzoneids.push(zoneid);
            }
        }
        return res.render('market/agentall/edit',{
            staff:results.staff,
            upstaff:results.upstaff,
            agents:results.agents,
            oldzoneids:JSON.stringify(oldzoneids),
            villages:JSON.stringify(results.villages),
            zones:JSON.stringify(results.zones),
            error:req.query.error
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('market_agentall_edit',req,res)){
        return;
    }
    var username = req.body.username;
    if (!username){
        return res.redirect('/market/agentall/?error=无效的账户名');
    }
    var showname = req.body.showname;
    if (!username){
        return res.redirect('/market/agentall/edit.html?username=' + username +'&error=无效的姓名');
    }
    var password = req.body.password;
    if (!password){
        return res.redirect('/market/agentall/edit.html?username=' + username +'&error=无效的登录密码');
    }
    var mobile = req.body.mobile;
    if (!mobile){
        return res.redirect('/market/agentall/edit.html?username=' + username +'&error=无效的手机号码');
    }
    var staffname = req.body.staffname;
    if (!staffname){
        return res.redirect('/market/agentall/edit.html?username=' + username +'&error=无效的上级营销专员');
    }
    var zone = req.body.zone;
    if (!zone){
        return res.redirect('/market/agentall/edit.html?username=' + username +'&error=无效的代理区域');
    }
    var idcard = req.body.idcard;
    if (!idcard){
        return res.redirect('/market/agentall/edit.html?username=' + username +'&error=无效的代理人身份证号码');
    }
    var bankname = req.body.bankname;
    var bankuser = req.body.bankuser;
    var bankno = req.body.bankno;
    var blockedvalue = req.body.blocked;
    var blocked = 0;
    if (blockedvalue && blockedvalue == 'on'){
        blocked = 1;
    }
    //切开小区关键字
    var villageobjects = JSON.parse(zone);
    var oldzoneids = JSON.parse(req.body.oldzoneids);
    async.series([
        function(checkvillagekey){
            async.every(villageobjects,function(item,callback){
                var zoneid = item[9];
                var keys = [];
                if (item[4] != ''){
                    keys.push(item[4]);
                }
                if (item[5] != ''){
                    keys.push(item[5]);
                }
                if (item[6] != ''){
                    keys.push(item[6]);
                }
                async.every(keys,function(item,callback){
                    db.query('select t_agents_villagekey.id from t_agents_villagekey left join t_agents_village on t_agents_villagekey.villageid = t_agents_village.id where t_agents_village.zoneid = ? and t_agents_village.username != ? and t_agents_villagekey.villagekey like \'%' + item + '%\'',[zoneid,username],function(err,result){
                        if (err){
                            console.error('在数据库中执行查询小区关键字是否存在错误',err);
                            return callback(false);
                        }
                        if (result.length > 0){
                            return callback(false);
                        }
                        return callback(true);
                    });
                },function(result){
                    callback(result);
                });
            },function(result){
                if (result != true){
                    return checkvillagekey('已经存在的代理小区关键字');
                } else {
                    return checkvillagekey(null);
                }
            });
        }
    ],function(err){
        if (err){
            return res.redirect('/market/agentall/edit.html?username=' + username +'&error=' + err);
        }
        return db.getConnection(function(err,connection){
            if (err){
                console.error('在数据库连接池获取连接失败',err);
                return res.redirect('/market/agentall/edit.html?username=' + username +'&error=新增代理人失败');
            }
            return connection.beginTransaction(function(err){
                if (err){
                    console.error('数据库开始执行事务失败',err);
                    connection.release();
                    return res.redirect('/market/agentall/edit.html?username=' + username +'&error=新增代理人失败');
                }
                return async.series([
                    function(update_staff){
                        if (password == 'changeme'){
                            connection.query('update t_staffs set showname = ?,mobile = ?,remark = ?,updatetime = now() where username = ?',[showname,mobile,'代理人',username],function(err){
                                update_staff(err);
                            });
                        } else {
                            connection.query('update t_staffs set password = ?,showname = ?,mobile = ?,remark = ?,updatetime = now() where username = ?',[encodeutil.md5(password),showname,mobile,'代理人',username],function(err){
                                update_staff(err);
                            });
                        }
                    },
                    function(delete_oldrole){
                        connection.query('delete from t_staffs_role where username = ?',[username],function(err){
                            delete_oldrole(err);
                        })
                    },
                    function(insert_roles){
                        connection.query('insert into t_staffs_role (username,rolename) values (?,?)',[username,'代理人'],function(err){
                            insert_roles(err);
                        });
                    },
                    function(update_agents){
                        connection.query('update t_agents set idcard = ?,bankname = ?,bankuser = ?,bankno = ?,updatetime = now(),upstaff = ?,blocked = ? where username = ?',[idcard,bankname,bankuser,bankno,staffname,blocked,username],function(err){
                            update_agents(err);
                        });
                    },
                    function(delete_villagekeys){
                        connection.query('delete t_agents_villagekey from t_agents_villagekey,t_agents_village where t_agents_villagekey.villageid = t_agents_village.id and t_agents_village.username = ?',[username],function(err){
                            delete_villagekeys(err);
                        });
                    },
                    function(delete_villages){
                        connection.query('delete from t_agents_village where username = ?',[username],function(err){
                            delete_villages(err);
                        });
                    },
                    function(insert_villages){
                        async.forEach(villageobjects,function(item,callback){
                            connection.query('insert into t_agents_village (username,zoneid,address,villagename,households,updatetime) values (?,?,?,?,?,now())',[username,item[9],item[2],item[1],item[3]],function(err,result){
                                if (err){
                                    console.error('在数据库插入代理人小区信息错误',err);
                                    return callback(err);
                                }
                                var villageid = result.insertId;
                                var keys = [];
                                if (item[4] != ''){
                                    keys.push(item[4]);
                                }
                                if (item[5] != ''){
                                    keys.push(item[5]);
                                }
                                if (item[6] != ''){
                                    keys.push(item[6]);
                                }
                                async.forEach(keys,function(item,callback){
                                    connection.query('insert into t_agents_villagekey (villageid,villagekey,updatetime) values (?,?,now())',[villageid,item],function(err){
                                        if (err){
                                            console.error('在数据库插入小区关键字信息错误',err);
                                        }
                                        callback(err);
                                    });
                                },function(err){
                                    callback(err);
                                })
                            });
                        },function(err){
                            insert_villages(err);
                        });
                    }
                ],function(err){
                    if (err) {
                        console.error('在数据库插入新的代理人时出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.redirect('/market/agentall/edit.html?username=' + username +'&error=编辑代理人失败');
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
                                return res.redirect('/market/agentall/edit.html?username=' + username +'&error=编辑代理人失败');
                            });
                        }
                        connection.release();
                        var zoneidarray = [];
                        for (var i = 0;i < villageobjects.length;i++){
                            var village = villageobjects[i];
                            var zoneid = Number(village[9]);
                            if (zoneidarray.indexOf(zoneid) == -1){
                                zoneidarray.push(zoneid);
                            }
                        }
                        for (var j = 0;j < oldzoneids.length;j++){
                            var oldzoneid = oldzoneids[j];
                            if (zoneidarray.indexOf(oldzoneid) == -1){
                                zoneidarray.push(oldzoneid);
                            }
                        }
                        updateagentdao.updateagent(zoneidarray);
                        return res.redirect('/market/agentall/?info=编辑代理人' + showname + '成功');
                    });
                });
            });
        });
    });
});

router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('market_agentall_del',req,res)){
        return;
    }
    var username = req.query.username;
    if (!username){
        return res.redirect('/market/agentall/?error=无法删除代理人');
    }
    db.query('select zoneid from t_agents_village where username = ?',[username],function(err,zoneresult){
        if (err){
            console.error('在数据库获取代理人的所有代理街道失败',err);
            return res.redirect('/market/agentall/?error=无法删除代理人');
        }
        return db.getConnection(function(err,connection){
            if (err){
                console.error('在数据库连接池获取连接失败',err);
                return res.redirect('/market/agentall/?error=删除代理人失败');
            }
            return connection.beginTransaction(function(err){
                if (err){
                    console.error('数据库开始执行事务失败',err);
                    connection.release();
                    return res.redirect('/market/agentall/?error=删除代理人失败');
                }
                return async.series([
                    function(delete_staff){
                        connection.query('delete from t_staffs where username = ?',[username],function(err){
                            delete_staff(err);
                        });
                    },
                    function(delete_staffrole){
                        connection.query('delete from t_staffs_role where username = ?',[username],function(err){
                            delete_staffrole(err);
                        });
                    },
                    function(delete_agents){
                        connection.query('delete from t_agents where username = ?',[username],function(err){
                            delete_agents(err);
                        });
                    },
                    function(delete_villagekeys){
                        connection.query('delete t_agents_villagekey from t_agents_villagekey,t_agents_village where t_agents_villagekey.villageid = t_agents_village.id and t_agents_village.username = ?',[username],function(err){
                            delete_villagekeys(err);
                        });
                    },
                    function(delete_villages){
                        connection.query('delete from t_agents_village where username = ?',[username],function(err){
                            delete_villages(err);
                        });
                    }
                ],function(err){
                    if (err) {
                        console.error('在数据库删除代理人时出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.redirect('/market/agentall/?error=删除代理人失败');
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
                                return res.redirect('/market/agentall/?error=删除代理人失败');
                            });
                        }
                        connection.release();
                        var zoneidarray = [];
                        for (var i = 0;i < zoneresult.length;i++){
                            var row = zoneresult[i];
                            var zoneid = Number(row.zoneid);
                            if (zoneidarray.indexOf(zoneid) == -1){
                                zoneidarray.push(zoneid);
                            }
                        }
                        updateagentdao.updateagent(zoneidarray);
                        return res.redirect('/market/agentall/?info=删除代理人' + username + '成功');
                    });
                });
            });
        });
    });
});

module.exports = router;