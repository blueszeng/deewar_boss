var debug = true;
var wechatapi = require('../wechat/api');
var cloopenapi = require('../cloopen/api');
var numberutils = require('../../utils/number');
var datetimeutils = require('../../utils/datetime');

var start = function(wechatid,wechatactive,usermobile,tiptext,cityid,orderid,ordertime,canceler,reason,userid){
    var orderno = numberutils.paddingLeft(String(cityid),4) + numberutils.paddingLeft(String(orderid),6) + numberutils.paddingLeft(String(ordertime.getSeconds() * ordertime.getMinutes()),4);
    if (wechatid && wechatactive && wechatactive == 1 && !debug){
        var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe82fe6f71bd0a94d&redirect_uri=' + encodeURIComponent('http://wx.yixixie.com/mobile/wechat.html') + '&response_type=code&scope=snsapi_base&state=detail_' + orderid + '#wechat_redirect';
        var notifyuserdata = {
            first:{
                value:'亲，订单已由' + canceler + '因'+reason+'的原因而被取消。\r\n',
                color:'#4caf50'
            },
            keyword1:{
                value:orderno,
                color:'#4caf50'
            },
            keyword2:{
                value:datetimeutils.formatdatetime(new Date()),
                color:'#4caf50'
            },
            remark:{
                value:'\r\n' + tiptext + '，如有任何疑问，请直接在此回复'
            }
        };
        wechatapi.sendTemplate(wechatid,'Xasfo9XQrStJ1y_s5tsDP12FsGbFaBwmN96AxoDMpQU',url,'#4caf50',notifyuserdata,function(err){
            if (err){
                console.error('发送微信模版消息失败',err);
            }
        });
    } else if (usermobile){
        cloopenapi.sendsms(usermobile,24217,[orderno,reason + '原因'],userid,0);
    }
};

exports.start = start;