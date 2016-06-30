/**
 * Created by jimmychou on 14/12/21.
 */
var wechatapi = require('wechat-api');
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

var wechat = new wechatapi(wxid, wxkey, function (callback) {
    redisClient.get('wechat:token',function(err,result){
        if (err){
            return callback(err);
        }
        if (!result){
            return callback(null,null);
        }
        return callback(null, JSON.parse(result));
    });
}, function (token, callback) {
    console.log('成功获取微信访问TOKEN并保存到缓存');
    redisClient.setex('wechat:token',3600,JSON.stringify(token));
    return callback(null, token);
});

module.exports = wechat;
