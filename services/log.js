/**
 * Created by jimmychou on 15/1/7.
 */
var morgan = require('morgan');
var logger = require('log4js');

exports.init = function(app){
    logger.configure({
        appenders: [
            { type: 'console' }
        ],
        replaceConsole: true
    });

    var log = logger.getLogger('http');
    log.setLevel(app.debug ? 'DEBUG' : 'INFO');

    app.use(logger.connectLogger(log, {level: logger.levels.INFO, format:':remote-addr :method :url :status :response-time'+'ms'}));

    var httplogger = morgan('short',{
        "stream": {
            "write" : function(str) { log.debug(str); }
        }
    });

    app.use(httplogger);
};