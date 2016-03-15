
var fs = require('fs');
var byline = require('byline');

function parse(file, callback) {
    var stream = byline(fs.createReadStream(file, { encoding: 'utf8' }));
    var desc = { };
    var current = '';

    stream.on('readable', function() {
	var line;
	while (null !== (line = stream.read())) {
	    if (line.match(/^[^\s]/) && current !== '') {
		try {
		    var rec = split_record(current);
		    desc[ rec.key ] = rec.value;
		}
		catch(e) {
		    callback(e); return;
		}
		current = line;
	    } else {
		current = current + '\n' + line;
	    }
	}
	try {
	    var rec = split_record(current);
	    desc[ rec.key ] = rec.value;
	}
	catch(e) {
	    callback(e); return;
	}
    });

    stream.on('end', function() {
	callback(null, desc);
    });
}

function split_record(str) {
    var colon = str.indexOf(":");
    if (colon < 0) { throw ("Invalid record: " + str); return; }
    return { 'key': str.substr(0, colon).trim(),
	     'value': str.substr(colon + 1).trim() };
}

module.exports = parse;
