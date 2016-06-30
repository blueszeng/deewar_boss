/**
 * Created by jimmychou on 15/2/13.
 */
var cache = require('../cache');
var request = require('request');
var wechatapi = require('../../services/wechat/api');
var debug = true;
var wxid;
if (debug){
    wxid = 'wx06664faccb2e45dd';
} else {
    wxid = 'wxe82fe6f71bd0a94d';
}

exports.createcard = function(cardname,amount,expiredate,getlimit,callback){
    wechatapi.getLatestToken(function(err,result){
        if (err){
            console.error('获取微信TOKEN失败',err);
            return callback(err);
        }
        var options = {
            uri:'https://api.weixin.qq.com/card/create?access_token=' + result.accessToken,
            method:'POST',
            json:{
                card:{
                    card_type:'CASH',
                    //default_detail:'价值' + amount + '元专业鞋子清洁护理服务代金券1张',
                    cash:{
                        base_info:{
                            logo_url:'http://mmbiz.qpic.cn/mmbiz/del5l4107kyk0Oia2r0SrkKlYIFWKpqLb9hsiaFM5eAvNR0S7VJT3gL7jzHWY9XdPxJYCIOpuiaVhBcqUWcByfbcg/0',
                            code_type:'CODE_TYPE_TEXT',
                            brand_name:'e洗鞋',
                            title:cardname,
                            sub_title:'洗护超便捷，天天穿新鞋',
                            color:'Color030',
                            notice:'下单洗护时可抵现金使用',
                            description:'e洗鞋为您的爱鞋提供微信下单、上门取送、洗护合一的清洁护理服务。无论男鞋、女鞋，无论运动鞋、休闲鞋、皮鞋、皮靴价格均一。 \n领取本券后可在下单后的订单确认页面选择“优惠”，选中该券即可在原订单总额的基础上直减' + amount + '元',
                            date_info:{
                                type:2,
                                fixed_term:expiredate
                            },
                            sku:{
                                quantity:1000
                            },
                            get_limit:getlimit,
                            use_custom_code:true,
                            bind_openid:false,
                            can_share:false,
                            can_give_friend:true,
                            custom_url_name:'立即使用',
                            custom_url:'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe82fe6f71bd0a94d&redirect_uri=http%3A%2F%2Fwx.yixixie.com%2Fmobile%2Fwechat.html&response_type=code&scope=snsapi_base&state=order#wechat_redirect',
                            custom_url_sub_title:'超值特惠'
                        },
                        reduce_cost:amount*100,
                        least_cost:0
                    }
                }
            }
        };
        request(options,function(error, response, body){
            if (!error && response.statusCode == 200){
                if (body.errcode != 0){
                    console.error('微信卡券创建错误：',body,options);
                    return callback('微信卡券创建错误');
                }
                return callback(null,body.card_id);
            } else {
                console.error('微信卡券创建时无法访问微信服务器');
                return callback('微信卡券创建异常');
            }
        });
    });
};
