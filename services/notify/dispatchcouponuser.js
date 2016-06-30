var debug = true;
var wechatapi = require('../wechat/api');
var db = require('../db');
var datetimeutils = require('../../utils/datetime');

var start = function(wechatid,wechatactive,couponid,remark){
    if (wechatid && wechatactive && wechatactive == 1 && !debug){
        db.query('select * from t_coupons where id = ?',[couponid],function(err,result){
            if (err){
                console.error('在数据库查询优惠券类型错误',err);
                return;
            }
            if (result.length == 0){
                return;
            }
            var coupon = result[0];
            var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe82fe6f71bd0a94d&redirect_uri=' + encodeURIComponent('http://wx.yixixie.com/mobile/wechat.html') + '&response_type=code&scope=snsapi_base&state=coupon#wechat_redirect';
            var notifyuserdata = {
                first:{
                    value:'亲，恭喜获得' + coupon.amount + '元优惠券。\r\n',
                    color:'#2196f3'
                },
                orderTicketStore:{
                    value:'每单仅限使用1张',
                    color:'#2196f3'
                },
                orderTicketRule:{
                    value:datetimeutils.formatdatecoupon(coupon.expiredate),
                    color:'#2196f3'
                },
                remark:{
                    value:remark
                }
            };
            wechatapi.sendTemplate(wechatid,'l3k82GXwhGM_oAV1D5QsNONdPDn_OoaqF8CmWPklhaE',url,'#2196f3',notifyuserdata,function(err){
                if (err){
                    console.error('发送微信模版消息失败',err);
                }
            });
        });
    }
};

exports.start = start;
