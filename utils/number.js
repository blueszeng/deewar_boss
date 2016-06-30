/**
 * Created by jimmychou on 15/1/19.
 */

function padLeft(str,lenght){
    if(str.length >= lenght)
        return str;
    else
        return padLeft("0" +str,lenght);
}

exports.paddingLeft = padLeft;