/**
 * Created by jimmychou on 15/1/7.
 */
//创建菜单
var wechatapi = require('./api');
var wechatoauth = require('./oauth');
var debug = true;

var server;
if (debug){
    server = 'http://192.168.7.154:3001/mobile/wechat.html';
} else {
    server = 'http://wx.yixixie.com/mobile/wechat.html';
}

var orderurl = wechatoauth.getAuthorizeURL(server,'order','snsapi_base');
var userurl = wechatoauth.getAuthorizeURL(server,'user','snsapi_base');
var orderlisturl = wechatoauth.getAuthorizeURL(server,'orderlist','snsapi_base');
var couponurl = wechatoauth.getAuthorizeURL(server,'coupon','snsapi_base');

var menuobject = {
  "button":[{
      "type":"view",
      "name":"结业公告",
      "url":"http://s.p.qq.com/pub/jump?d=AAATlCYv"
  }]
};


/*
var menuobject = {
    "button":[{
        "type":"view",
        "name":"最新活动",
        "url":"http://m.wsq.qq.com/264301957/t/13"
    },{
        "name":"福利社",
        "sub_button":[{
            "type":"view",
            "name":"优惠券",
            "url":couponurl
        },{
            "type":"view",
            "name":"最新活动",
            "url":"http://m.wsq.qq.com/264301957/t/13"
        },{
            "type":"view",
            "name":"鞋粉社区",
            "url":"http://wsq.qq.com/reflow/264301957"
        }]
    },{
        "name":"服务中心",
        "sub_button":[{
            "type":"click",
            "name":"服务介绍",
            "key":"intro"
        },{
            "type":"click",
            "name":"新手引导",
            "key":"newbie"
        },{
            "type":"click",
            "name":"服务价格",
            "key":"price"
        },{
            "type":"view",
            "name":"个人中心",
            "url": userurl
        },{
            "type":"view",
            "name":"订单查询",
            "url": orderlisturl
        }]
    }]
};
*/



exports.getmenu=function(){
    return JSON.stringify(menuobject);
};

exports.create = function(menustring,callback){
    var object;
    try{
        object = JSON.parse(menustring);
    }catch(er){
        return callback(er);
    }
    wechatapi.createMenu(object,function(err){
        if (err){
            console.error('创建自定义菜单失败', err);
            callback(err);
        } else {
            console.log('创建自定义菜单成功');
            callback(null);
        }
    });
};
