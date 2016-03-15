
var test = require('ava').test;
var desc = require('.');

test.cb('D1', function(t) {
    desc('./test/D1', function(err, d) {
	t.is(err, null);
	t.is(d.Package, 'parr');
	t.is(d.Maintainer, 'Gabor Csardi <csardi.gabor@gmail.com>');
	t.is(d.RoxygenNote, '5.0.1');
	t.end();
    });
});

test.cb('D2', function(t) {
    desc('./test/D2', function(err, d) {
	t.is(err, null);
	t.is(d.Package, 'roxygen2');
	t.is(d.Depends, 'R (>= 3.0.2)');
	t.end();
    });
});

test.cb('D3', function(t) {
    desc('./test/D3', function(err, d) {
	console.log(err);
	t.is(err, "Invalid record: ");
	t.end();
    });

})
