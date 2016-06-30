client = require('../stores/redis')

redisHsetP = (key, field, value) ->
  new Promise (resolve, reject) ->
  client.hset key, field, value, (err, res) ->
    if err
      reject err
    else
      resolve res

redisHgetP = (key, field) ->
  new Promise (resolve, reject) ->
    client.hget key, field, (err, res) ->
      if err
        reject err
      else
        resolve res


redisSetExpP = (key, expire, value) ->
  console.log key, expire, value
  new Promise (resolve, reject) ->
    client.setex key, expire, value, (err, res) ->
      if err
        reject err
      else
        resolve res


redisGetP = (key) ->
  new Promise (resolve, reject) ->
    console.log key
    client.get key, (err, res) ->
      if err
        reject err
      else
        resolve res

redisDelP = (key) ->
  new Promise (resolve, reject) ->
    client.del key, (err, res) ->
      if err
        reject err
      else
        resolve res



module.exports =
  redisHsetP: redisHsetP
  redisHgetP: redisHgetP
  redisSetExpP: redisSetExpP
  redisGetP: redisGetP
  redisDelP: redisDelP
