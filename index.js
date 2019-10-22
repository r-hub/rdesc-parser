var deps = require('rhub-node').dependency_types;
var byline = require('byline');
var fs = require('fs');

function parse(stream, callback) {
    var stream = byline(stream, { keepEmptyLines: true });
    var desc = { };
    var current = '';
    var first = true;

    stream.setEncoding('utf8');

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
	    if (deps.indexOf(rec.key) > -1) {
	      rec.value = parse_dep(rec.value);
	    }
	    if (rec.key == 'Remotes') {
	      rec.value = parse_remotes(rec.value);
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

function parse_dep(str) {
  return str.split(/,[\s]*/);
}

function parse_remotes(str) {
  return str.split(/,[\s]*/);
}

function split_record(str) {
    var colon = str.indexOf(":");
    return { 'key': str.substr(0, colon).trim(),
	     'value': str.substr(colon + 1).trim() };
}

function parse_file(path, callback) {
    parse(fs.createReadStream(path, { 'encoding': 'utf8' }), callback)
}

parse.parse_file = parse_file;

module.exports = parse;
