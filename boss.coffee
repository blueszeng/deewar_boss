require ('coffee-script/register')
express = require('express')
app = express()
debug = app.get('env') == 'development'
exports.debug = debug
path = require('path')
cookieParser = require('cookie-parser')
require('es6-promise').polyfill()
#增加RAWBODY处理接收原始数据的问题
app.use (req, res, next) ->
    contentType = req.headers['content-type'] or ''
    mime = contentType.split(';')[0]
    if !(mime == 'text/plain' or mime == 'application/xml')
        return next()
    data = ''
    req.setEncoding 'utf8'
    req.on 'data', (chunk) ->
        data += chunk
        return
    req.on 'end', ->
        req.rawBody = data
        next()
        return
    return
bodyParser = require('body-parser')
session = require('express-session')
RedisStore = require('connect-redis')(session)
dust = require('dustjs-linkedin')

dust.optimizers.format = (ctx, node) ->
    node
require 'dustjs-helpers'
require './helpers/formatdate'
cons = require('consolidate')
app.engine 'dust', cons.dust
app.set 'template_engine', 'dust'
app.set 'views', path.join(__dirname, 'views')
app.set 'view engine', 'dust'
app.set 'port', 3002
app.set 'trust proxy', 1
log = require('./services/log')
log.init app
storage = require('./services/storage')
storage.init()
rbaccore = require('./services/rbac/core')
rbaccore.init()
updateagentdao = require('./services/dao/updateagent')
updateagentdao.initagent()
schedulecoupon = require('./services/coupon/schedule')
schedulecoupon.start()

###
var scheduletaobao = require('./services/taobao/schedule');
scheduletaobao.start();
###

###
var scheduleNashui = require('./services/nashui/schedule');
scheduleNashui.start();
###

redisClient = require('./stores/redis')
app.use bodyParser.json(null)

app.use bodyParser.urlencoded(extended: false)
app.use express.static(path.join(__dirname, 'public'))
app.use cookieParser()

app.use session(
    store: new RedisStore(
        client: redisClient
        prefix: 'boss_sess:')
    secret: 'savierugi4234'
    resave: false
    saveUninitialized: false
    unset: 'keep'
    rolling: true
    cookie:
        maxAge: 60 * 60 * 8 * 1000
        path: '/'
        httpOnly: true
        secure: false)

cloopen = require('./services/cloopen/callback')
app.use '/cloopen', cloopen
editor = require('./services/editor/ueditor')
app.use '/utils/editor', editor()
webfilter = require('./services/web/filter')
webfilter.init app
app.use '/', require('./routes/index')
# catch 404 and forward to error handler
app.use (req, res, next) ->
    err = new Error('Not Found')
    err.status = 404
    next err
    return
# error handlers
# development error handler
# will print stacktrace


if debug
    app.use (err, req, res) ->
        res.status err.status or 500
        res.render 'error',
          message: err.message
          error: err
        return

console.log('xxxxxxxxxxxx11')
app.use (err, req, res) ->
    res.status err.status or 500
    res.render 'error',
        message: err.message
        error: {}
    return
console.log('xxxxxxxxxxxx22')
console.log('thisisis-->')
http = require('http').Server(app)
console.log('dddd-->')
console.log app.get('port')
http.listen app.get('port'), ->
    if debug
        console.log '当前环境为开发环境'
    else
        console.log '当前环境为生产环境'
  console.log '服务开启成功 *:3002' + __dirname
  return

console.log('aaaappppppppppppppppppppp')
module.exports = app
