/**
 * Created by jimmychou on 15/2/12.
 */
var path = require('path');
var fs = require('fs');

var Payment = require('wechat-pay').Payment;
var initConfig = {
    partnerKey: '52a5a390ab8311e4ac9a4d50f39e5260',
    appId: 'wxe82fe6f71bd0a94d',
    mchId: '1231248102',
    notifyUrl: 'http://wx.junewinds.com/notify/wechatpay',
    pfx: fs.readFileSync(path.resolve(__dirname, '../../other/wechatcert/apiclient_cert.p12'))
};
module.exports.payment = new Payment(initConfig);
module.exports.getconfig = function(){
    return initConfig;
};