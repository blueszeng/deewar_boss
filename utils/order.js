exports.parseorderno = function(orderno){
    var string = orderno.slice(4,10);
    return parseInt(string);
};