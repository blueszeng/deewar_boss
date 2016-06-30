var guid = 1000;

var getFileName = function(extname){
    var d = new Date();
    return [ d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(),
            d.getMinutes(), d.getSeconds(), d.getMilliseconds(), guid++ ]
            .join('_') + extname;
};

exports.getfilename = getFileName;