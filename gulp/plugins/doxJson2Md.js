'use strict';

var Stream = require('stream');
var Path = require('path');

function gulpRename(obj) {

    var stream = new Stream.Transform({objectMode: true});

    function parsePath(path) {
        var extname = Path.extname(path);
        return {
            dirname: Path.dirname(path),
            basename: Path.basename(path, extname),
            extname: extname
        };
    }

    stream._transform = function (file, unused, callback) {
        console.log('a file');
        callback(null, file);
    };

    return stream;
}

module.exports = gulpRename;