/**
 * Created by jimmychou on 15/1/7.
 */

var crypto = require('crypto');

exports.md5 = function (str) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
};