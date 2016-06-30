mysql = require('mysql')
console.log('mmmmmmmmmmm')
debug = true
configDb =
  host: '192.168.1.238'
  user: 'root'
  password: '123456'
  port: '3306'
  database: 'deerwar_test'
deerdb = undefined
if debug
  deerdb = mysql.createPool(
    host: configDb.host
    user: configDb.user
    password: configDb.password
    port: configDb.port
    database: configDb.database
    connectionLimit: 8
    waitForConnections: true
    queueLimit: 0
    multipleStatements: true)
else
  deerdb = mysql.createPool(
    host: configDb.host
    user: configDb.user
    password: configDb.password
    port: configDb.port
    database: configDb.database
    connectionLimit: 8
    waitForConnections: true
    queueLimit: 0
    multipleStatements: true)
deerdb.on 'connection', (connection) ->
  console.log '数据库连接已分配'
  connection.on 'error', (err) ->
    console.error '数据库错误', err.code
    return
  connection.on 'end', (err) ->
    console.error '数据库连接结束', err
    return
  return
module.exports = deerdb
