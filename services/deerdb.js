/**
 * Created by jimmychou on 14/12/22.
 */
var mysql = require('mysql');
var debug = true;
var config = require('./dbSeting')
var configDb = config.getDBconfig()
var deerdb;
if (debug){
    deerdb  = mysql.createPool({
        host     : configDb.host,
        user     : configDb.user,
        password : configDb.password,
        port: configDb.port,
        database: configDb.database,
        connectionLimit: 8,
        waitForConnections: true,
        queueLimit: 0,
        multipleStatements: true
    });


} else {
  deerdb  = mysql.createPool({
      host     : configDb.host,
      user     : configDb.user,
      password : configDb.password,
      port: configDb.port,
      database: configDb.database,
      connectionLimit: 8,
      waitForConnections: true,
      queueLimit: 0,
      multipleStatements: true
    });
}
deerdb.on('connection', function(connection) {
    console.log('数据库连接已分配');
    connection.on('error', function(err) {
        console.error('数据库错误', err.code);
    });
    connection.on('end', function(err) {
        console.error('数据库连接结束', err);
    });
});


module.exports = deerdb;
