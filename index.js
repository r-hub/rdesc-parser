
var fs = require('fs');
var byline = require('byline');

function parse(file, callback) {
    var stream = byline(fs.createReadStream(file),
			{ encoding: 'utf8', keepEmptyLines: true });
    var desc = { };
    var current = '';
    var first = true;

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
		stream.removeListener('data', reader);
		stream.removeListener('end', finisher);
		return callback('Invalid record: ' + rec.value);
	    }
	    desc[ rec.key ] = rec.value;
	    current = line;
	}
    }

    function finisher() {
	callback(null, desc);
    }

    stream.on('data', reader);
    stream.on('end', finisher);
}

function split_record(str) {
    var colon = str.indexOf(":");
    return { 'key': str.substr(0, colon).trim(),
	     'value': str.substr(colon + 1).trim() };
}

module.exports = parse;
