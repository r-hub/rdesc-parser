
var test = require('ava');
var fs = require('fs');
var desc = require('.');

test.cb('D1', function(t) {
    desc(fs.createReadStream('./test/D1', { 'encoding': 'utf8' }),
	 function(err, d) {
	     t.is(err, null);
	     t.is(d.Package, 'parr');
	     t.is(d.Maintainer, 'Gabor Csardi <csardi.gabor@gmail.com>');
	     t.is(d.RoxygenNote, '5.0.1');
	     t.end();
	 });
});

test.cb('D2', function(t) {
    desc(fs.createReadStream('./test/D2', { 'encoding': 'utf8' }),
	 function(err, d) {
	     t.is(err, null);
	     t.is(d.Package, 'roxygen2');
	     t.is(d.Depends.length, 1);
	     t.is(d.Depends[0], 'R (>= 3.0.2)');
	     t.end();
	 });
});

test.cb('D3', function(t) {
    desc(fs.createReadStream('./test/D3', { 'encoding': 'utf8' }),
	 function(err, d) {
	     console.log(err);
	     t.is(err, "Invalid record: ");
	     t.end();
	 });

})

test.cb('parse_file', function(t) {
    desc.parse_file('./test/D1', function(err, d) {
        t.is(err, null);
	t.is(d.Package, 'parr');
	t.is(d.Maintainer, 'Gabor Csardi <csardi.gabor@gmail.com>');
	t.is(d.RoxygenNote, '5.0.1');
	t.end();
    });
});
