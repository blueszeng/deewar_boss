/**
 * Created by jimmychou on 15/1/8.
 */
var db = require('../db');
var datatable = require('./datatable');

exports.pagedata = function(tableDefinition,req,res){
    var queryBuilder = new datatable(tableDefinition);
    var requestQuery = req.body;
    var queries = queryBuilder.buildQuery( requestQuery );
    var sql = queries.join('');
    return db.query( sql, function( err, resultArray ) {
        if (err){
            console.error('在数据库查询列表错误',err,sql);
        }
        var result = queryBuilder.parseResponse(resultArray);
        return res.json(result);
    });
};

var deerdb = require('../deerdb');
exports.pagedataDeer = function(tableDefinition,req,res){
    var queryBuilder = new datatable(tableDefinition);
    var requestQuery = req.body;
    var queries = queryBuilder.buildQuery( requestQuery );
    var sql = queries.join('');
    console.log(sql)
    return deerdb.query( sql, function( err, resultArray ) {
        if (err){
            console.error('在数据库查询列表错误',err,sql);
        }
      //  console.log(resultArray, 'body--->', requestQuery)
        var result = queryBuilder.parseResponse(resultArray);
        return res.json(result);
    });
};
