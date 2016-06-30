/**
 * Created by jimmychou on 15/1/8.
 */
var express = require('express')
var db = require('../../services/deerdb')
var async = require('async')
var dataquery = require('../../services/web/dataquery')
var rbaccore = require('../../services/rbac/core')
var encodeutil = require('../../utils/encode')
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('organization_team',req,res)){
        return;
    }
    return res.render('organization/team/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('organization_team',req,res)){
        return;
    }
    var tabledefinition = {
        sTableName: 't_team',
        sCountColumnName:'id',
        aoColumnDefs: [
            { mData: 'name', bSearchable: true },
            { mData: 'logoUrl', bSearchable: true },
            { mData: 'ext', bSearchable: true },
            { mData: 'id', bSearchable: true },
            { mData: null, bSearchable: true}
        ]};
        const ret = dataquery.pagedataDeer(tabledefinition,req,res);
        return res
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_team_add',req,res)){
        return;
    }
    return res.render('organization/team/add')
});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_team_add',req,res)){
        return;
    }
    var name = req.body.name;
    if (!name){
        return res.redirect(`/organization/team/add.html?error=${encodeURI('球队名不能为空')}`);
    }
    return db.query('insert into t_team(name, logoUrl, ext) value(?,?,?)',[name, req.body.logUrl, req.body.ext],function(err,result){
        if (err)　{
            console.error('在数据库中添加球队失败',err);
            return res.redirect(`/organization/team/add.html?error=${encodeURI('添加球队失败')}`);
        }
        return res.redirect(`/organization/team/?info=${encodeURI('添加球队成功')}`);
    });
});

router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_team_edit',req,res)){
        return;
    }
    var userId = req.query.id;
    console.log(req.query)
    if (!userId){
        return res.redirect(`/organization/team/?error=${encodeURI('无法编辑球队')}`);
    }
    var sql = `
        select * from t_team where id = ?
        `
    db.query(sql,[userId],function(err,result){
        if (err){
            return res.redirect(`/organization/team/?error=${encodeURI('无法编辑球队')}`);
        }
        if (result.length == 0){
            res.redirect(`/organization/team/?error=${encodeURI('无法编辑球队')}`);
        }
        console.log(result[0])
        return res.render('organization/team/edit',{
            team:result[0]
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_team_edit',req,res)){
        return;
    }
    var teamId = req.body.teamId;
    console.log(req.body)
    if (!teamId){
        return res.redirect(`/organization/team/?error=${encodeURI('无法编辑球队')}`);
    }
    var name = req.body.name;
    if (!name){
        return res.redirect(`/organization/team/edit.html?error=${encodeURI('姓名不能为空')}`);
    }
    console.log(req.body)
    return db.query('update t_team set name = ?, logoUrl = ?, ext = ? where id = ?',
      [req.body.name,req.body.logUrl, req.body.ext, teamId],function(err,result){
        if (err){
            console.error('在数据库中修改球队失败',err);
            return res.redirect(`/organization/team/edit.html?error=${encodeURI('编辑球队失败')}`);
        }
        return res.redirect(`/organization/team/?info=${encodeURI('编辑球员成功')}`);
    });
});


router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('organization_team_del',req,res)){
        return;
    }
    var teamId = req.query.teamId;
    if (!teamId){
        return res.redirect(`/organization/team/?error=${encodeURI('无法删除球队')}`);
    }

    return async.waterfall([
        function(playerTeam){
          var sql = `delete  from t_team_player where teamId = ?`
            db.query(sql,[teamId],function(err){
                playerTeam(err);
            });
        },
        function(teamDppg){
            var sql = `delete  from t_team where id = ?`
            db.query(sql,[teamId],function(err){
              teamDppg(err);
        });
      }
    ],function(err){
        if (err) {
              return res.render('organization/team/',{
                  error:'删除球队失败'
              });
            }
          return res.redirect(`/organization/team/?info=${encodeURI('删除人员' + req.query.name + '成功')}`);
          }
    );
  });

module.exports = router;
