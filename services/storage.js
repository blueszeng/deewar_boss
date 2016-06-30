/**
 * Created by jimmychou on 14/12/25.
 */
var qiniu = require('qiniu');

var _storagetoken = function(key){
    var putpolicy = new qiniu.rs.PutPolicy('xixieba');
    putpolicy.scope = 'xixieba:' + key;
    putpolicy.expires = 60 * 60 * 10;
    return putpolicy.token();
};

var _filetoken = function(key){
    var putpolicy = new qiniu.rs.PutPolicy('website');
    putpolicy.scope = 'website:' + key;
    putpolicy.expires = 60 * 60 * 10;
    return putpolicy.token();
};

var init = function(){
    qiniu.conf.ACCESS_KEY = '1CUT4Jxwzci3rrgj5LvSXTv6jKU6erRNmya2wBdP';
    qiniu.conf.SECRET_KEY = 'bLZqv3HXTyV_cQ-EtNdWlHPMsP_ABFyyOppJfYrf';
};

var uploadbase64 = function(base64str,key,fn){
    var imageBuffer = new Buffer(base64str, 'base64');
    var extra = new qiniu.io.PutExtra();
    var token = _storagetoken(key);
    qiniu.io.put(token,key,imageBuffer,extra,function(err,result){
        if (err){
            console.error('七牛文件上传失败',err);
            return fn(err);
        }
        return fn(null,result.key);
    });
};

var uploadwebsite = function(file,filename,fn){
    var extra = new qiniu.io.PutExtra();
    var token = _filetoken(filename);
    qiniu.io.putFile(token,filename,file,extra,function(err,result){
        if (err){
            console.error('七牛网站文件上传失败',err);
            return fn(err);
        }
        return fn(null,'http://7xica5.com1.z0.glb.clouddn.com/' + result.key);
    });
};

var geturl = function(filename){
    return 'http://7te8tq.com1.z0.glb.clouddn.com/' + filename;
};

module.exports.uploadbase64 = uploadbase64;
module.exports.init = init;
module.exports.geturl = geturl;
module.exports.uploadwebsite = uploadwebsite;