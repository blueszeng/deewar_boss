var debug = true;
var wechatapi = require('../wechat/api');
var cloopenapi = require('../cloopen/api');
var numberutils = require('../../utils/number');
var datetimeutils = require('../../utils/datetime');

var start = function(wechatid,wechatactive,usermobile,cityid,orderid,ordertime,quality,staffname,staffmobile,userid){
    var orderno = numberutils.paddingLeft(String(cityid),4) + numberutils.paddingLeft(String(orderid),6) + numberutils.paddingLeft(String(ordertime.getSeconds() * ordertime.getMinutes()),4);
    if (wechatid && wechatactive && wechatactive == 1 && !debug){
        var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe82fe6f71bd0a94d&redirect_uri=' + encodeURIComponent('http://wx.yixixie.com/mobile/wechat.html') + '&response_type=code&scope=snsapi_base&state=detail_' + orderid + '#wechat_redirect';
        var notifyuserdata = {
            first:{
                value:'亲，订单服务已完成。\r\n',
                color:'#2196f3'
            },
            keyword1:{
                value:orderno,
                color:'#2196f3'
            },
            keyword2:{
                value:datetimeutils.formatdatetime(new Date()),
                color:'#2196f3'
            },
            remark:{
                value:'\r\n您交洗的' + quality + '双鞋子已清洗完成并由' + staffname + '(' + staffmobile + ')送回。\r\n\r\n点击详情可以查看鞋子照片，还可以分享给小伙伴们抢礼包哦～'
            }
        };
        wechatapi.sendTemplate(wechatid,'31KLrLwApxu38cQnntMF6n-_6q6VgN9kpjJNApfIMKY',url,'#2196f3',notifyuserdata,function(err){
            if (err){
                console.error('发送微信模版消息失败',err);
            }
        });
    } else if (usermobile){
        cloopenapi.sendsms(usermobile,24373,[orderno,String(quality),staffname,staffmobile],userid,0);
    }
};

exports.start = start;