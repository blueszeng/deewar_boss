exports.getclientip = function(req){
    var ipAddress;
    var headers = req.headers;
    var forwardedIpsStr = headers['x-forwarded-for'] || headers['x-real-ip'];
    if (forwardedIpsStr){
        ipAddress = forwardedIpsStr;
    } else {
        ipAddress = null;
    }
    if (!ipAddress) {
        ipAddress = req.connection.remoteAddress;
    }
    return ipAddress;
};