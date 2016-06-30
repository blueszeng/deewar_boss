var db = {
  host     : '',
  user     : '',
  password : '',
  port: '',
  database: ''
}

var initDefaultDb  = function () {
  db.host  = '192.168.1.238',
  db.user = 'root',
  db.password = '123456',
  db.port = '3306',
  db.database = 'deerwar_test'
}

var setDBconfig = function (dbConfig) {
  var dbKeyList = dbConfig.keys(dbConfig)
  for (var i = 0; i < dbKeyList.length; i ++) {
    db[dbKeyList[i]] = dbConfig[dbKeyList[i]]
  }
}

var setDBconfigIp = function (dbConfigIp) {
  db.host  = dbConfigIp
  db.user = 'root'
  db.port = '3306'
  db.database = 'deerwar_test'
}

var getDBconfig = function (dbConfig) {
  return db
}

initDefaultDb()
// setDBconfigIp('112.74.58.22')

// console.log(db)

module.exports = {
  initDefaultDb: initDefaultDb,
  setDBconfig: setDBconfig,
  setDBconfigIp: setDBconfigIp,
  getDBconfig: getDBconfig
};
