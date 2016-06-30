var debug = true;
var db = require('../db');
var numberutils = require('../../utils/number');
var datetimeutils = require('../../utils/datetime');
var wechatapi = require('../wechat/api');
var cloopenapi = require('../cloopen/api');
var async = require('async');

var start = function(orderid,staffname,staffmobile){
    async.waterfall([
        function(select_order){
            db.query('select userid,ordertime,cityid,quality,price,doortime,vendorid from t_orders where id = ?',[orderid],function(err,result){
                if (err){
                    console.error('在数据库查询订单错误',err,orderid);
                    return select_order('无效的订单');
                }
                if (result.length == 0){
                    return select_order('无效的订单');
                }
                var order = result[0];
                return select_order(null,{
                    userid:order.userid,
                    ordertime:order.ordertime,
                    cityid:order.cityid,
                    quality:order.quality,
                    price:order.price,
                    doortime:order.doortime,
                    vendorid:order.vendorid
                });
            });
        },
        function(orderinfo,select_user){
            db.query('select wechatid,wechatactive,mobile from t_users where id = ?',[orderinfo.userid],function(err,result){
                if (err){
                    console.error('在数据库查询用户错误',err,orderinfo.userid);
                    return select_user('无效的用户');
                }
                if (result.length == 0){
                    return select_user('无效的用户');
                }
                var user = result[0];
                return select_user(null,{
                    wechatid:user.wechatid,
                    wechatactive:user.wechatactive,
                    usermobile:user.mobile,
                    userid:orderinfo.userid,
                    ordertime:orderinfo.ordertime,
                    cityid:orderinfo.cityid,
                    quality:orderinfo.quality,
                    price:orderinfo.price,
                    doortime:orderinfo.doortime,
                    vendorid:orderinfo.vendorid
                });
            });
        }
    ],function(err,result){
        if (err){
            return;
        }
        if (result.wechatid && result.wechatactive && result.wechatactive == 1 && !debug){
            //发送微信模版消息
            var jumpurl = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe82fe6f71bd0a94d&redirect_uri=' + encodeURIComponent('http://wx.yixixie.com/mobile/wechat.html') + '&response_type=code&scope=snsapi_base&state=detail_' + orderid + '#wechat_redirect';
            var ordertimestring = datetimeutils.formatdatetime(result.ordertime);
            var notifyuserdata = {
                first:{
                    value:'亲，您已经成功下单洗鞋。\r\n',
                    color:'#2196f3'
                },
                keyword1:{
                    value:numberutils.paddingLeft(String(result.cityid),4) + numberutils.paddingLeft(String(orderid),6) + numberutils.paddingLeft(String(result.ordertime.getSeconds() * result.ordertime.getMinutes()),4),
                    color:'#2196f3'
                },
                keyword2:{
                    value:ordertimestring,
                    color:'#2196f3'
                },
                keyword3:{
                    value:result.quality + '双',
                    color:'#2196f3'
                },
                keyword4:{
                    value:result.price + '元',
                    color:'#2196f3'
                },
                remark:{
                    value:'\r\n取鞋小哥' + staffname + '(' + staffmobile + ')将在' + datetimeutils.formatdoortime(result.doortime) + '上门取鞋，如有特殊时间要求，请直接电话联系他。\r\n如有其他任何疑问，请直接在公众号内回复。'
                }
            };
            wechatapi.sendTemplate(result.wechatid,'8-fPYNe2E2asa75Vlu6xEfs3WOw_gpvyO9oUCm3sjes',jumpurl,'#2196f3',notifyuserdata,function(err){
                if (err){
                    console.error('发送微信模版消息失败',err,notifyuserdata);
                }
            });
        } else if (result.usermobile){
            var orderno = numberutils.paddingLeft(String(result.cityid),4) + numberutils.paddingLeft(String(orderid),6) + numberutils.paddingLeft(String(result.ordertime.getSeconds() * result.ordertime.getMinutes()),4);
            var doortimestring = datetimeutils.formatdoortime(result.doortime);
            cloopenapi.sendsms(result.usermobile,24038,[orderno,staffname,staffmobile,doortimestring,String(result.quality)],result.userid,0);
        }
    });
};

exports.start = start;