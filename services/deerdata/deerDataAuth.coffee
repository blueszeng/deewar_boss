redisCommon = require('../../cache/common')
http = require('../../utils/http')
require('es6-promise').polyfill()
WECHAT_MCH_ID = "1346625101"
WECHAT_NOTIFY_URL = 'http://wechat.deerwar.com/api/common/wechat/notify'
DEER_DATA_CLIENT_ID = 'Va5yQRHlA4Fq4eR3LT0vuXV4'
DEER_DATA_CLIENT_SECRET = '0rDSjzQ20XUj5itV7WRtznPQSzr5pVw2'
DEER_DATA_GRANTTYPE_REFRESH_TOKEN = 'refresh_token'
DEER_DATA_GRANTTYPE_CREDENTIALS = 'client_credentials'
DEER_DATA_CALLBACK_URL ='http://wechat.deerwar.com/api/common/deerdata/callback'
DEER_DATA_BASE_URL = 'http://192.168.1.238:5003'
DEER_DATA_TEST_SOCCER_CLUB_SERVICE_BASE_URL = 'http://192.168.1.238:5010'
DEER_DATA_TEST_SOCCER_COMPETITION_SERVICE_BASE_URL = 'http://192.168.1.238:5005'
DEER_DATA_TEST_SOCCER_PLAYER_SERVICE_BASE_URL = 'http://192.168.1.238:5011'
DEER_DATA_TEST_SOCCER_STAT_SERVICE_BASE_URL = 'http://192.168.1.238:5008'
DEER_DATA_TEST_SOCCER_STRATEGY_SERVICE_BASE_URL = 'http://192.168.1.238:5014'
DEER_WAR_DWR = 0.1
DEER_WAR_SALARYCAP = 200

TOKEN_URL = "#{DEER_DATA_BASE_URL}/oauth/token"
REDIS_KEY_ACCESS_TOKEN = 'deerdata:oauth:accessToken'
REDIS_KEY_REFRESH_TOKEN = 'deerdata:oauth:refreshToken'
REDIS_KEY_SESSION_KEY = 'deerdata:oauth:sessionKey'
OAUTH_KEY_EXPIRES_IN = 'expires_in'
OAUTH_KEY_ACCESS_TOKEN = 'access_token'
OAUTH_KEY_REFRESH_TOKEN = 'refresh_token'
OAUTH_KEY_SESSION_KEY = 'session_key'

DEVELOPMENT = true


generateSign = (queries = {}, sessionKey) ->
  console.log queries, sessionKey
  queryStr = generateQueryStr queries, sessionKey
  encryptWithMD5(queryStr).toLowerCase()

generateQueryStr = (queries, sessionKey) ->
  orderedQueries = []
  queries.forEach (value, key, map) ->
    orderedQueries.push key
  orderedQueries.sort()
  queryStr = ''
  for _, i in orderedQueries
    key = orderedQueries[i]
    value = queries[key]
    queryStr += "#{key}=#{value}&"
  queryStr += "sessionKey=#{sessionKey}"
  queryStr

refreshRedis = (oauthInfo) ->
  new Promise (resolve, reject) ->
    expiresIn = oauthInfo[OAUTH_KEY_EXPIRES_IN]
    console.log 'exp-->', expiresIn
    Promise.all [
      redisCommon.redisSetExpP  REDIS_KEY_ACCESS_TOKEN,
         expiresIn - 200,  oauthInfo[OAUTH_KEY_ACCESS_TOKEN]
      redisCommon.redisSetExpP  REDIS_KEY_SESSION_KEY,
         expiresIn - 200,  oauthInfo[OAUTH_KEY_SESSION_KEY]
      redisCommon.redisSetExpP  REDIS_KEY_REFRESH_TOKEN,
        expiresIn,  oauthInfo[OAUTH_KEY_REFRESH_TOKEN]
     ]
    .then () ->
      resolve(true)
    .catch (err) ->
      reject(err)

getOauthInfo =  () ->
  new Promise (resolve, reject) ->
    datas =
      client_id: DEER_DATA_CLIENT_ID
      client_secret: DEER_DATA_CLIENT_SECRET
      grant_type: DEER_DATA_GRANTTYPE_CREDENTIALS
      callback_url: DEER_DATA_CALLBACK_URL
    http.post TOKEN_URL, datas, {}
    .then (res) ->
      console.log 'getOauthInfo', res
      refreshRedis(res)
      console.log 5677
    .then () ->
      console.log 'exit'
      resolve(true)

refreshOauthInfo =  () ->
  new Promise (resolve, reject) ->
    redisCommon.redisGetP   REDIS_KEY_REFRESH_TOKEN
    .then (refreshToken) ->
      datas =
        refresh_token: refreshToken
        grant_type: DEER_DATA_GRANTTYPE_REFRESH_TOKEN
      http.post TOKEN_URL, datas, {}
      .then (res) ->
        refreshRedis(res)
      .then () ->
        resolve(true)


generateUrl = (refUrl) ->
  if not DEVELOPMENT
    console.log 'dev'
    "#{DEER_DATA_BASE_URL}/api#{refUrl}"
  else
    console.log 'no-->'
    baseUrl = ''
    queryStr = ''
    if refUrl.startsWith('/soccer/club')
      baseUrl = DEER_DATA_TEST_SOCCER_CLUB_SERVICE_BASE_URL
      queryStr = refUrl.slice('/soccer/club'.length)
    if refUrl.startsWith('/soccer/competition')
      baseUrl = DEER_DATA_TEST_SOCCER_COMPETITION_SERVICE_BASE_URL
      queryStr = refUrl.slice('/soccer/competition'.length)
    if refUrl.startsWith('/soccer/player')
      baseUrl = DEER_DATA_TEST_SOCCER_PLAYER_SERVICE_BASE_URL
      queryStr = refUrl.slice('/soccer/player'.length)
    if refUrl.startsWith('/soccer/stat')
      baseUrl = DEER_DATA_TEST_SOCCER_STAT_SERVICE_BASE_URL
      queryStr = refUrl.slice('/soccer/stat'.length)
    if refUrl.startsWith('/soccer/strategy')
      baseUrl = DEER_DATA_TEST_SOCCER_STRATEGY_SERVICE_BASE_URL
      queryStr = refUrl.slice('/soccer/strategy'.length)
    "#{baseUrl}#{queryStr}"



getDataFromDeerData =  (queries, refUrl) ->
  new Promise (resolve, reject) ->
    if not DEVELOPMENT
      accessToken = sessionKey = null
      Promise.all([redisCommon.redisGetP  REDIS_KEY_ACCESS_TOKEN,
        redisCommon.redisGetP  REDIS_KEY_SESSION_KEY])
      .then (res) ->
        accessToken = res[0]
        sessionKey = res[1]
        if not accessToken
          redisCommon.redisGetP  REDIS_KEY_REFRESH_TOKEN
          .then (refreshToken) ->
            if refreshToken
              refreshOauthInfo()
            else
              getOauthInfo()
          .then () ->
            Promise.all([redisCommon.redisGetP REDIS_KEY_ACCESS_TOKEN,
              redisCommon.redisGetP REDIS_KEY_SESSION_KEY])
          .then (res) ->
            accessToken = res[0]
            sessionKey = res[1]
      .then () ->
        sign = generateSign queries, sessionKey
        queries['sign'] = sign
        headers =
          'Authorization': "Bearer #{accessToken}"
        url = generateUrl(refUrl)
        http.get url, mapToObj(queries), headers
        .then (res) ->
          console.log 'getDataFromDeerData: %s', JSON.stringify(res)
          resolve(res)
        .catch (err) ->
          reject(err)
    else
      #  url = generateUrl(refUrl)
      http.get refUrl, null, {}
      .then (res) ->
        console.log 'getDataFromDeerData: %s', JSON.stringify(res)
        resolve(res)
      .catch (err) ->
        console.log err
        reject(err)


excuteGetDataFromDeerData = (refUrl, queries = {}) ->
  new Promise (resolve, reject) ->
    getDataFromDeerData queries, refUrl
    .then (res) ->
      resolve res
    .catch (err) ->
      reject err

module.exports =
  excuteGetDataFromDeerData : excuteGetDataFromDeerData


# test1 = () ->
#   new Promise (resolve, reject) ->
#     resolve 1200
# test2 = () ->
#   new Promise (resolve, reject) ->
#     resolves 2000
# tt = (b, a ={}) ->

# do () ->
#   refUrl = '/soccer/stat/stats'
#   t = () ->
#     excuteGetDataFromDeerData(refUrl)
#     .then (res) ->
#       console.log res
#   setTimeout t, 1000
