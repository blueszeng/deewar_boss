var debug = true
var wechatapi = require('../wechat/api');
var db = require('../db');
console.log("yyyyyyyyyyyyyyyyyyy")
var datetimeutils = require('../../utils/datetime');

var start = function(userid,cardname){
    db.query('select * from t_users where id = ?',[userid],function(err,result){
        if (err){
            console.error('在数据库中查询用户信息错误',err);
            return;
        }
        if (result.length == 0){
            return;
        }
        var user = result[0];
        if (user.wechatid && user.wechatactive && user.wechatactive == 1 && !debug){
            var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe82fe6f71bd0a94d&redirect_uri=' + encodeURIComponent('http://wx.yixixie.com/mobile/wechat.html') + '&response_type=code&scope=snsapi_base&state=coupon#wechat_redirect';
            var notifyuserdata = {
                first:{
                    value:'亲，您有一张' + cardname + '在3天后即将过期。\r\n',
                    color:'#2196f3'
                },
                orderTicketStore:{
                    value:'所有鞋类清洁护理',
                    color:'#2196f3'
                },
                orderTicketRule:{
                    value:'每单仅限使用1张',
                    color:'#2196f3'
                },
                remark:{
                    value:'速速召唤取鞋小哥上门享受专业的鞋子清洁护理服务吧！点击详情可查看优惠券详情。'
                }
            };
            wechatapi.sendTemplate(user.wechatid,'DvnGXQFm42tFThLjGdwz3kIOjsvEDFwtOUb1y-Z2rkM',url,'#2196f3',notifyuserdata,function(err){
                if (err){
                    console.error('发送微信模版消息失败',err);
                }
            });
        }
    });
};

exports.start = start;
