var debug = true;
var wechatapi = require('../wechat/api');
var db = require('../db');

var start = function(wechatid,wechatactive,amount,remark,orderno){
    if (wechatid && wechatactive && wechatactive == 1 && !debug){
        var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe82fe6f71bd0a94d&redirect_uri=' + encodeURIComponent('http://wx.yixixie.com/mobile/wechat.html') + '&response_type=code&scope=snsapi_base&state=user#wechat_redirect';
        var notifyuserdata = {
            first:{
                value:'亲，恭喜获得' + amount + '元返现。\r\n',
                color:'#2196f3'
            },
            order:{
                value:orderno,
                color:'#2196f3'
            },
            money:{
                value:amount + '元',
                color:'#2196f3'
            },
            remark:{
                value:'您参加的' + remark + '返现活动充值已到账,点击详情可查看账户最新余额哦~'
            }
        };
        wechatapi.sendTemplate(wechatid,'hYy1hpwbbD34BhR1v4mR69TuEo5aS9Bz8XXOMAweXys',url,'#2196f3',notifyuserdata,function(err){
            if (err){
                console.error('发送微信模版消息失败',err);
            }
        });
    }
};

exports.start = start;
