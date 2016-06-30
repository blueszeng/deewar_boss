redis = require('redis')
debug = true
redisClient = undefined
if debug
  redisClient = redis.createClient('6379', '192.168.1.238')
else
  redisClient = redis.createClient('6379',
  '6ab8cbf55ae041f8.m.cnsza.kvstore.aliyuncs.com',
    username: 'ae598f3b892411e4'
    password: '9c1a_b358')
  redisClient.auth '6ab8cbf55ae041f8:Dirdell888', redis.print
redisClient.on 'error', (err) ->
  console.error 'Redis错误', err
  return
redisClient.on 'connect', ->
  console.log 'Redis服务已连接'
  return
redisClient.on 'ready', ->
  console.log 'Redis服务已准备好'
  return
module.exports = redisClient
