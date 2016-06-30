var wechatoauth = require('wechat-oauth');
var redisClient = require('../../stores/redis');
var debug = true;
var wxid;
var wxkey;
if (debug){
    wxid = 'wx06664faccb2e45dd';
    wxkey = '67b3f0717a44f5b252de34a5bc0ee6ac';
} else {
    wxid = 'wxe82fe6f71bd0a94d';
    wxkey = '36442d79dc7d210fd5aac5375aa2b381';
}

var oauth = new wechatoauth(wxid, wxkey, function (openid, callback) {
    redisClient.hget('wechat:oauth',openid,function(err,result){
        if (err) {
            return callback(err);
        }
        if (!result){
            return callback(null,null);
        }
        return callback(null, JSON.parse(result));
    });
}, function (openid, token, callback) {
    redisClient.hset('wechat:oauth',openid,JSON.stringify(token));
    return callback(null, token);
});

module.exports = oauth;
