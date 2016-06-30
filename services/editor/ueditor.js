var path = require('path');
var url = require('url');
var os = require('os');
var fs = require('fs');
var storage = require('../storage');
var fsutils = require('../../utils/fs');
var Busboy = require('busboy');

var config = {
    configfile: '/assets/global/plugins/ueditor/config.json'
};

var ueditor = function() {
    return function (req, res, next) {
        _ueditor(req, res, next);
    }
};

var _ueditor = function(req, res) {
    switch (req.query.action) {
        case 'config':
            res.setHeader('Content-Type', 'application/json');
            res.redirect(config.configfile);
            break;
        case 'uploadimage':
            uploadfile(req, res);
            break;
        case 'listimage':
            notsupport(req, res);
            break;
        case 'uploadscrawl':
            uploadfile(req, res);
            break;
        case 'uploadfile':
            uploadfile(req, res);
            break;
        case 'listfile':
            notsupport(req,res);
            break;
    }
};

var uploadfile = function (req, res) {
    var busboy = new Busboy({
        headers: req.headers,
        limits:{
            fileSize: 2048000,
            fieldSize: 2048000
        }
    });
    busboy.on('file', function(fieldname, file, filename) {
        var isReturn = false;
        save(file, filename, req, function (err, url) {
            if (isReturn) return;
            isReturn = true;
            var r = {
                'url': url,
                'original': filename,
                'state':'SUCCESS'
            };
            if (err) {
                r.state = 'ERROR';
            }
            res.json(r);
        });
    });
    busboy.on('filesLimit',function(){
        res.json({
            'state':'ERROR'
        });
    });
    busboy.on('fieldsLimit',function(){
        res.json({
            'state':'ERROR'
        });
    });
    req.pipe(busboy);
};


var save = function (file, filename, req, callback) {
    var realName = fsutils.getfilename(path.extname(filename));
    var saveTo = path.join(os.tmpDir(), realName);
    file.pipe(fs.createWriteStream(saveTo));
    file.on('end', function() {
        var id = setTimeout(function() {
            callback('timeout');
        }, 300000);
        putObject(realName, saveTo, id, callback);
    });
};

var putObject = function(filename, src, id, callback) {
    storage.uploadwebsite(src,filename,function(err,result){
        clearTimeout(id);
        if (err){
            callback('上传失败','');
        } else {
            callback(null,result);
        }
    });
};

var notsupport = function(req,res){
    res.status(500);
    res.json({
        state: 'ERROR'
    });
};


module.exports = ueditor;