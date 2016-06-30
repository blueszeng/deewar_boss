var request = require('request');
var thunkify = require('thunkify');
var http_post = thunkify(request.post);
var _ = require('lodash');
var querystring = require('querystring');

var CONST = require('./const.js');
var API_URL = CONST.API_URL;
var NOTIFY_EFFECT = CONST.NOTIFY_EFFECT;
var NOTIFY_TYPE = CONST.NOTIFY_TYPE;
var NOTIFY_ID = CONST.NOTIFY_ID;
var NOTIFY_FOREGROUND = CONST.NOTIFY_FOREGROUND;
var PASS_THROUGH = CONST.PASS_THROUGH;


var MiPush = function(_config){
    this.config = _config;
};

module.exports = exports = MiPush;

/**
 * Push to registration_id
 *
 * @return {Function}
 * @api public
 */
MiPush.prototype.send_to_reg_id = function(reg_id, msg, option,callback){
    var _msg = {
        'description': msg.desc,
        'payload': JSON.stringify(msg.payload),
        'title': msg.title,
        'registration_id': reg_id
    };
    return this.send_msg(_msg, option, API_URL.S_MSG_REGID,callback);
};

MiPush.prototype.send_to_all = function(msg, option,callback){
    var _msg = {
        'description': msg.desc,
        'payload': JSON.stringify(msg.payload),
        'title': msg.title
    };
    return this.send_msg(_msg, option, API_URL.B_MSG_ALL,callback);
};


/**
 * Send msg to reg_id, topic, aliases
 *
 * @api private
 */
MiPush.prototype.send_msg = function(msg, option, url,callback){
    option = option || {};
    var extend_msg = {
        'notify_type': option.notify_type || NOTIFY_TYPE.DEFAULT,
        'pass_through': option.pass_through || PASS_THROUGH.NO,
        'notify_id': option.notify_id || NOTIFY_ID.ID_0,
        'extra.notify_effect': option.notify_effect || NOTIFY_EFFECT.DEFAULT
    };

    _.assign(msg, extend_msg);

    // Set notify_foreground
    if(option.hasOwnProperty('notify_foreground')){
        msg['extra.notify_foreground'] = option.notify_foreground;
    } else {
        msg['extra.notify_foreground'] = NOTIFY_FOREGROUND.DEFAULT;
    }

    // Custom sound_url
    if(option.sound_url){
        msg['extra.sound_uri'] = option.sound_url;
    }

    // Custom effect of click notify
    if(option.notify_effect){
        if(option.notify_effect == NOTIFY_EFFECT.INTENT_URI && option.intent_uri){
            msg['extra.intent_uri'] = option.intent_uri;
        } else if(option.notify_effect == NOTIFY_EFFECT.WEB_URI && option.web_uri){
            msg['extra.web_uri'] = option.web_uri;
        }
    }

    var req_option = this.build_request_option(url, msg);
    return http_post(req_option)(function(err,str){
        if (callback){
            callback(err);
        }
    });
};

/**
 * build message for pushing
 *
 * @api private
 */
MiPush.prototype.build_msg = function(msg){
    msg['restricted_pakage_name'] = this.config.PACKAGE_NAME;
};

/**
 * build request option
 *
 * @return {Object}
 * @api private
 */
MiPush.prototype.build_request_option = function(url, msg){
    if(msg){
        this.build_msg(msg);
        var _url = url + '?' + querystring.stringify(msg);
    } else {
        _url = url;
    }
    return {
        url: _url,
        headers: {
            'Authorization': 'key=' + this.config.APP_SECRET
        }
    };
};
