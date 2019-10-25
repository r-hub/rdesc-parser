var deps = require('rhub-node').dependency_types;
var byline = require('byline');
var fs = require('fs');
var filetype = require('file-type');
var tar = require('tar-stream');
var gunzip = require('gunzip-maybe');
var unzip = require('unzipper');
var stream = require('stream');

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
	      rec.value = parse_dep(rec.value);
	    }
	    if (rec.key == 'Remotes') {
	      rec.value = parse_remotes(rec.value);
	    }
        if (rec.key == 'Built') {
          rec.value = parse_built(rec.value);
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

function parse_dep(str) {
  return str.split(/,[\s]*/);
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
        if (!done && header.name.match(/^[^\/]+\/DESCRIPTION$/)) {
            done = true;
            parse_desc_stream(tarstream, function(err, d) {
                extract.destroy();
                callback(err, d);
            });
        } else {
            tarcb()
        }

        tarstream.resume();
    });

    extract.on('finish', function() {
        if (!done) { callback('No DESCRIPTION file in tar archive'); }
    })

    extract.on('error', function(err) {
        callback(err);
        extract.destroy();
    })

    descstream
        .pipe(gunzip())
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
            if (mime === "application/gzip" || mime === "application/x-tar") {
                parse_tar_stream(x, callback);
            } else if (mime = "application/zip") {
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

module.exports = parse_desc_stream;
