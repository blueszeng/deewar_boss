/**
 * Created by jimmychou on 14/12/30.
 */

var appendzero = function(s){
    return ('00' + s).substr((s + '').length);
};

var formatdatestring = function(time){
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    var offset= time.getTime() - today.getTime();
    if (offset >= 0 && offset <= 1000*60*60*24){
        return '今天';
    } else if (offset > 1000*60*60*24 && offset <= 1000*60*60*24*2){
        return '明天';
    } else if (offset > 1000*60*60*24*2 && offset <= 1000*60*60*24*3){
        return '后天';
    } else {
        return (time.getMonth() + 1) + '月' + time.getDate() + '日';
    }
};

exports.formatdate = function(time){
    return time.getFullYear() + '-' + appendzero(time.getMonth() + 1) + '-' + appendzero(time.getDate());
};

exports.formatdatetime = function(time){
    return time.getFullYear() + '年' +  (time.getMonth() + 1) + '月' + time.getDate() + '日 ' + time.getHours() + ':' + time.getMinutes();
};

exports.formatdatecoupon = function(expiredate){
    var time = new Date((new Date()).getTime() + 86400000 * Number(expiredate));
    return time.getFullYear() + '年' +  (time.getMonth() + 1) + '月' + time.getDate() + '日前使用有效';
};

exports.formatday = function(datespan){
    if (datespan == 0){
        return '今天';
    }
    if (datespan == 1){
        return '明天';
    }
    if (datespan == 2){
        return '后天';
    }
    var time = new Date((new Date()).getTime() + 86400000 * Number(datespan));
    var days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    return days[time.getDay()];
};

exports.formatdoortime = function(time){
    var hour = time.getHours();
    var string = formatdatestring(time) + hour + '点';
    if (hour == 10){
        string = string + '至12点之间';
    } else if (hour == 12){
        string = string + '至14点之间';
    } else if (hour == 14){
        string = string + '至18点之间';
    } else if (hour == 18){
        string = string + '至21点之间';
    }
    return string;
};

exports.formatdoortime2 = function(time){
    var hour = time.getHours();
    var string = formatdatestring(time) + ' ' + hour + '点';
    if (hour == 10){
        string = string + '-12点';
    } else if (hour == 12){
        string = string + '-14点';
    } else if (hour == 14){
        string = string + '-18点';
    } else if (hour == 18){
        string = string + '-21点';
    }
    return string;
};