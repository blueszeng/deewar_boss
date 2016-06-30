/**
 * Created by jimmychou on 14/12/22.
 */
var memcached = require('aliyun-sdk').MEMCACHED;
var debug = true
var cache;

if (debug){
    cache = memcached.createClient('11211','192.168.1.238');
} else {
    cache = memcached.createClient('11211','ae598f3b892411e4.m.cnszalist3pub001.ocs.aliyuncs.com',{
        username:'ae598f3b892411e4',
        password:'9c1a_b358'
    });
}

cache.on('error', function(err) {
    console.error('缓存错误', err);
});

cache.on('connect',function(){
    console.log('缓存服务已连接');
});

cache.on('ready',function(){
    console.log('缓存服务已准备好');
});

module.exports = cache;
