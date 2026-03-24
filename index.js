var deps = require('r-constants').dependency_types;
var byline = require('byline');
var fs = require('fs');
var filetype = require('file-type');
var tar = require('tar-stream');
var zlib = require('zlib');
var unzip = require('unzipper');
var stream = require('stream');

function normalize_ws(x){
    return x.trim().replace(/\s/g, ' ');
}

// Similar to gunzip-maybe: check for gzip/zstd magic bytes and decompress if needed
function maybeGunzip() {
    var compressionType = null;
    var decompressor = null;
    var passthrough = null;
    var buffer = [];

    var proxy = new stream.Transform({
        transform: function(chunk, encoding, callback) {
            if (compressionType === null) {
                buffer.push(chunk);
                // Check for gzip magic bytes (0x1f, 0x8b)
                if (chunk.length >= 2 && chunk[0] === 0x1f && chunk[1] === 0x8b) {
                    compressionType = 'gzip';
                    decompressor = zlib.createGunzip();
                    var self = this;
                    decompressor.on('data', function(data) {
                        self.push(data);
                    });
                    decompressor.on('error', function(err) {
                        self.emit('error', err);
                    });
                    // Write buffered chunks
                    buffer.forEach(function(buf) {
                        decompressor.write(buf);
                    });
                    buffer = [];
                // Check for zstd magic bytes (0x28, 0xB5, 0x2F, 0xFD)
                } else if (chunk.length >= 4 && chunk[0] === 0x28 && chunk[1] === 0xB5 && chunk[2] === 0x2F && chunk[3] === 0xFD) {
                    compressionType = 'zstd';
                    decompressor = zlib.createZstdDecompress();
                    var self = this;
                    decompressor.on('data', function(data) {
                        self.push(data);
                    });
                    decompressor.on('error', function(err) {
                        self.emit('error', err);
                    });
                    // Write buffered chunks
                    buffer.forEach(function(buf) {
                        decompressor.write(buf);
                    });
                    buffer = [];
                } else if (chunk.length >= 4) {
                    // Not gzip or zstd, pass through
                    compressionType = 'none';
                    buffer.forEach(function(buf) {
                        this.push(buf);
                    }.bind(this));
                    buffer = [];
                }
                callback();
            } else if (compressionType !== 'none') {
                decompressor.write(chunk, encoding, callback);
            } else {
                this.push(chunk);
                callback();
            }
        },
        flush: function(callback) {
            if (compressionType !== 'none' && decompressor) {
                decompressor.end(callback);
            } else {
                callback();
            }
        }
    });

    return proxy;
}

function parse_desc_stream(descstream, callback) {
    var descstream = byline(descstream, { keepEmptyLines: true });
    var desc = { };
    var current = '';
    var first = true;

    descstream.setEncoding('utf8');

    function reader(line) {

	// First line is special
	if (first) {
	    current = line;
	    first = false;

	// Starts with space, same record, append
	} else if (line.match(/^\s/)) {
	    current = current + '\n' + line.trim();

	// New record, need to emit the previous one
	} else {
	    var rec = split_record(current);
	    if (rec.key === '') {
		// No way to close a stream, we just remove the listeners
		// if an error happens
		descstream.removeListener('data', reader);
		descstream.removeListener('end', finisher);
		return callback('Invalid record: ' + rec.value);
	    }
	    if (deps.indexOf(rec.key) > -1) {
	      rec.value = parse_dep_string(rec.value);
	    }
	    if (rec.key == 'Remotes') {
	      rec.value = parse_remotes(rec.value);
	    }
        if (rec.key == 'Built') {
          rec.value = parse_built(rec.value);
        }
        if (rec.key == 'Packaged') {
          rec.value = parse_packaged(rec.value);
        }
	    desc[ rec.key ] = rec.value;
	    current = line;
	}
    }

    function finisher() {
	callback(null, desc);
    }

    descstream.on('data', reader);
    descstream.on('end', finisher);
}

function parse_dep_string(str) {
  return str.split(/,[\s]*/s).filter(function(str){
    return str.trim(); //filter out empty strings
  }).map(function(str){
    return str.match(/\(.+\)/s) ?
        {
            package: normalize_ws(str.replace(/\(.+\)/s, '')),
            version: normalize_ws(str.replace(/.*\((.+)\)/s, '$1'))
        } : {
            package: normalize_ws(str)
        };
    });
}

function parse_remotes(str) {
  return str.split(/,[\s]*/);
}

function parse_built(str) {
  var built = str.split(/;[\s]*/);
  return {
    R: built[0].replace(/^R /, ''),
    Platform: built[1],
    Date: built[2],
    OStype: built[3]
  };
}

function parse_packaged(str) {
  var packaged = str.split(/;[\s]*/);
  return {
    Date: packaged[0],
    User: packaged[1]
  };
}

function split_record(str) {
    var colon = str.indexOf(":");
    return { 'key': str.substr(0, colon).trim(),
	     'value': str.substr(colon + 1).trim() };
}

function parse_desc_file(path, callback) {
    var descstream = fs.createReadStream(path);
    parse_desc_stream(descstream, callback)
}

function parse_tar_stream(descstream, callback) {
    var extract = tar.extract();
    var done = false;

    extract.on('entry', function(header, tarstream, tarcb) {
        tarstream.on('end', tarcb);
        tarstream.on('error', function(err){
            done = true;
            callback(err);
        });
        if (!done && header.name.match(/^[^\/]+\/DESCRIPTION$/)) {
            done = true;
            parse_desc_stream(tarstream, function(err, d) {
                callback(err, d);
            });
        } else {
            tarstream.resume();
        }
    });

    extract.on('finish', function() {
        if (!done) { callback('No DESCRIPTION file in tar archive'); }
    })

    extract.on('error', function(err) {
        callback(err);
    })

    descstream
        .pipe(maybeGunzip())
        .pipe(extract);
}

function parse_tar_file(path, callback) {
    var descstream = fs.createReadStream(path);
    parse_tar_stream(descstream, callback)
}

function parse_zip_stream(descstream, callback) {
    descstream
        .pipe(unzip.Parse())
        .on('entry', function (entry) {
            const fileName = entry.path;
            if (fileName.match(/^[^\/]+\/DESCRIPTION$/)) {
                parse_desc_stream(entry, function(err, cb) {
                    callback(err, cb);
                });
            } else {
                entry.autodrain();
            }
        });
}

function parse_zip_file(path, callback) {
    var descstream = fs.createReadStream(path);
    parse_zip_stream(descstream, callback)
}

function parse_stream(descstream, callback) {
    filetype.stream(descstream).then(function(x) {
        if (x.fileType !== undefined) {
            var mime = x.fileType.mime;
            if (mime === "application/gzip" || mime === "application/x-tar" || mime === "application/zstd") {
                parse_tar_stream(x, callback);
            } else if (mime === "application/zip") {
                parse_zip_stream(x, callback);
            } else {
                parse_desc_stream(x, callback);
            }
        } else {
            parse_desc_stream(x, callback)
        }
    })
}

function parse_file(path, callback) {
    var descstream = fs.createReadStream(path);
    parse_stream(descstream, callback);
}

parse_desc_stream.parse_desc_file  = parse_desc_file;
parse_desc_stream.parse_file       = parse_file;
parse_desc_stream.parse_stream     = parse_stream;
parse_desc_stream.parse_tar_file   = parse_tar_file;
parse_desc_stream.parse_tar_stream = parse_tar_stream;
parse_desc_stream.parse_zip_file   = parse_zip_file;
parse_desc_stream.parse_zip_stream = parse_zip_stream;
parse_desc_stream.parse_dep_string = parse_dep_string;

module.exports = parse_desc_stream;
