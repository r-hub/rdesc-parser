
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
         t.is(d.Imports.length, 8);
	     t.deepEqual(d.Depends[0], {package: 'R', version: '>= 3.0.2'});
         t.deepEqual(d.Imports[0], {package: 'stringr', version: '>= 0.5'});
         t.deepEqual(d.Imports[1], {package: 'stringi'});
         t.deepEqual(d.Imports[5], {package: 'Rcpp', version: '>= 0.11.0'});
         t.deepEqual(d.Suggests[0], {package: 'testthat', version: '>= 0.8.0'});
         t.end();
	 });
});

test.cb('D3', function(t) {
    desc(fs.createReadStream('./test/D3', { 'encoding': 'utf8' }),
	 function(err, d) {
	     t.is(err, "Invalid record: ");
	     t.end();
	 });

})

test.cb('parse_desc_file', function(t) {
    desc.parse_desc_file('./test/D1', function(err, d) {
        t.is(err, null);
	t.is(d.Package, 'parr');
	t.is(d.Maintainer, 'Gabor Csardi <csardi.gabor@gmail.com>');
	t.is(d.RoxygenNote, '5.0.1');
	t.end();
    });
});

test.cb('parse_tar_stream', function(t) {
    desc.parse_tar_stream(
        fs.createReadStream('./test/foobar_1.0.0.tar'),
        function(err, d) {
            t.is(err, null);
            t.is(d.Package, 'foobar');
            t.is(d.RoxygenNote, '6.0.1');
            t.end();
    });
});

test.cb('parse_tar_stream, gzipped', function(t) {
    desc.parse_tar_stream(
        fs.createReadStream('./test/foobar_1.0.0.tar.gz'),
        function(err, d) {
            t.is(err, null);
            t.is(d.Package, 'foobar');
            t.is(d.RoxygenNote, '6.0.1');
            t.end();
    });
});

test.cb('parse_tar_file', function(t) {
    desc.parse_tar_file('./test/foobar_1.0.0.tar', function(err, d) {
        t.is(err, null);
        t.is(d.Package, 'foobar');
        t.is(d.RoxygenNote, '6.0.1');
        t.end();
    });
});

test.cb('parse_tar_file, gzipped', function(t) {
    desc.parse_tar_file('./test/foobar_1.0.0.tar.gz', function(err, d) {
        t.is(err, null);
        t.is(d.Package, 'foobar');
        t.is(d.RoxygenNote, '6.0.1');
        t.end();
    });
});

test.cb('parse_zip_stream', function(t) {
    desc.parse_zip_stream(
        fs.createReadStream('./test/foobar_1.0.0.zip'),
        function(err, d) {
            t.is(err, null);
            t.is(d.Package, 'foobar');
            t.is(d.RoxygenNote, '6.0.1');
            t.end();
    });
});

test.cb('parse_zip_file', function(t) {
    desc.parse_zip_file('./test/foobar_1.0.0.zip', function(err, d) {
        t.is(err, null);
        t.is(d.Package, 'foobar');
        t.is(d.RoxygenNote, '6.0.1');
        t.end();
    });
});

test.cb('parse_file, plain file', function(t) {
    desc.parse_file('./test/D1', function(err, d) {
        t.is(err, null);
	t.is(d.Package, 'parr');
	t.is(d.Maintainer, 'Gabor Csardi <csardi.gabor@gmail.com>');
	t.is(d.RoxygenNote, '5.0.1');
	t.end();
    });
});

test.cb('parse_file, tar file', function(t) {
    desc.parse_file('./test/foobar_1.0.0.tar', function(err, d) {
        t.is(err, null);
	t.is(d.Package, 'foobar');
	t.is(d.RoxygenNote, '6.0.1');
	t.end();
    });
});

test.cb('parse_file, tar.gz file', function(t) {
    desc.parse_file('./test/foobar_1.0.0.tar.gz', function(err, d) {
        t.is(err, null);
	t.is(d.Package, 'foobar');
	t.is(d.RoxygenNote, '6.0.1');
	t.end();
    });
});

test.cb('parse_file, zip file', function(t) {
    desc.parse_file('./test/foobar_1.0.0.zip', function(err, d) {
        t.is(err, null);
	t.is(d.Package, 'foobar');
	t.is(d.RoxygenNote, '6.0.1');
    t.is(d.Built.R, '3.4.3');
    t.is(d.Built.Platform, '');
    t.is(d.Built.Date, '2017-12-25 19:19:13 UTC');
    t.is(d.Built.OStype, 'unix');
	t.end();
    });
});

test.cb('parse dependency string', function(t){
    var deps = desc.parse_dep_string("foo (>= 1.2.3), bar");
    t.deepEqual(deps[0], {package:'foo', version: '>= 1.2.3'});
    t.deepEqual(deps[1], {package:'bar'});
    t.end();
});
