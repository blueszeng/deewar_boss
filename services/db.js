/**
 * Created by jimmychou on 14/12/22.
 */
var mysql = require('mysql');
var debug = true
var db;
if (debug){
    db  = mysql.createPool({
        host     : '192.168.1.238',
        user     : 'root',
        password : '123456',
        port: '3306',
        database: 'yixixie',
        connectionLimit: 8,
        waitForConnections: true,
        queueLimit: 0,
        multipleStatements: true
    });
} else {
    db  = mysql.createPool({
        host     : 'rdsiuuajer3mfvf.mysql.rds.aliyuncs.com',
        user     : 'yixixie',
        password : '9c1a_b358',
        port: '3306',
        database: 'yixixie',
        connectionLimit: 3,
        waitForConnections: true,
        queueLimit: 0,
        multipleStatements: true
    });
}

db.on('connection', function(connection) {
    console.log('数据库连接已分配');
    connection.on('error', function(err) {
        console.error('数据库错误', err.code);
    });
    connection.on('end', function(err) {
        console.error('数据库连接结束', err);
    });
});

module.exports = db;
