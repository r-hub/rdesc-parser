
var test = require('ava');

var fs = require('fs');
var util = require('util');
var desc = util.promisify(require('.'));
desc.parse_desc_file = util.promisify(desc.parse_desc_file);
desc.parse_tar_stream = util.promisify(desc.parse_tar_stream);
desc.parse_tar_file = util.promisify(desc.parse_tar_file);
desc.parse_zip_stream = util.promisify(desc.parse_zip_stream);
desc.parse_zip_file = util.promisify(desc.parse_zip_file);
desc.parse_file = util.promisify(desc.parse_file);

test('D1', async function(t) {
    let s = fs.createReadStream('./test/D1', { 'encoding': 'utf8' });
    let d = await desc(s);
    t.is(d.Package, 'parr');
    t.is(d.Maintainer, 'Gabor Csardi <csardi.gabor@gmail.com>');
    t.is(d.RoxygenNote, '5.0.1');
});

test('D2', async function(t) {
    let s = fs.createReadStream('./test/D2', { 'encoding': 'utf8' });
    let d = await desc(s);
    t.is(d.Package, 'roxygen2');
    t.is(d.Depends.length, 1);
    t.is(d.Imports.length, 8);
    t.deepEqual(d.Depends[0], {package: 'R', version: '>= 3.0.2'});
    t.deepEqual(d.Imports[0], {package: 'stringr', version: '>= 0.5'});
    t.deepEqual(d.Imports[1], {package: 'stringi'});
    t.deepEqual(d.Imports[5], {package: 'Rcpp', version: '>= 0.11.0'});
    t.deepEqual(d.Suggests[0], {package: 'testthat', version: '>= 0.8.0'});
});

test('D3', async function(t) {
    await t.throwsAsync(
	desc(fs.createReadStream('./test/D3', { 'encoding': 'utf8' })),
	{ any: true },
	"Invalid record: "
    );
})

test('parse_desc_file', async function(t) {
    let d = await desc.parse_desc_file('./test/D1');
    t.is(d.Package, 'parr');
    t.is(d.Maintainer, 'Gabor Csardi <csardi.gabor@gmail.com>');
    t.is(d.RoxygenNote, '5.0.1');
});

test('parse_tar_stream', async function(t) {
    let d = await desc.parse_tar_stream(
        fs.createReadStream('./test/foobar_1.0.0.tar')
    );
    t.is(d.Package, 'foobar');
    t.is(d.RoxygenNote, '6.0.1');
});

test('parse_tar_stream, gzipped', async function(t) {
    let d = await desc.parse_tar_stream(
        fs.createReadStream('./test/foobar_1.0.0.tar.gz')
    );
    t.is(d.Package, 'foobar');
    t.is(d.RoxygenNote, '6.0.1');
});

test('parse_tar_file', async function(t) {
    let d = await desc.parse_tar_file('./test/foobar_1.0.0.tar');
    t.is(d.Package, 'foobar');
    t.is(d.RoxygenNote, '6.0.1');
});

test('parse_tar_file, gzipped', async function(t) {
    let d = await desc.parse_tar_file('./test/foobar_1.0.0.tar.gz');
    t.is(d.Package, 'foobar');
    t.is(d.RoxygenNote, '6.0.1');
});

test('parse_zip_stream', async function(t) {
    let d = await desc.parse_zip_stream(
        fs.createReadStream('./test/foobar_1.0.0.zip')
    );
    t.is(d.Package, 'foobar');
    t.is(d.RoxygenNote, '6.0.1');
});

test('parse_zip_file', async function(t) {
    let d = await desc.parse_zip_file('./test/foobar_1.0.0.zip');
    t.is(d.Package, 'foobar');
    t.is(d.RoxygenNote, '6.0.1');
});

test('parse_file, plain file', async function(t) {
    let d = await desc.parse_file('./test/D1');
    t.is(d.Package, 'parr');
    t.is(d.Maintainer, 'Gabor Csardi <csardi.gabor@gmail.com>');
    t.is(d.RoxygenNote, '5.0.1');
});

test('parse_file, tar file', async function(t) {
    let d = await desc.parse_file('./test/foobar_1.0.0.tar');
    t.is(d.Package, 'foobar');
    t.is(d.RoxygenNote, '6.0.1');
});

test('parse_file, tar.gz file', async function(t) {
    let d = await desc.parse_file('./test/foobar_1.0.0.tar.gz');
    t.is(d.Package, 'foobar');
    t.is(d.RoxygenNote, '6.0.1');
});

test('parse_file, zip file', async function(t) {
    let d = await desc.parse_file('./test/foobar_1.0.0.zip');
     t.is(d.Package, 'foobar');
    t.is(d.RoxygenNote, '6.0.1');
    t.is(d.Built.R, '3.4.3');
    t.is(d.Built.Platform, '');
    t.is(d.Built.Date, '2017-12-25 19:19:13 UTC');
    t.is(d.Built.OStype, 'unix');
});

test('parse dependency string', function(t) {
    var deps = desc.parse_dep_string("foo (>= 1.2.3), bar");
    t.deepEqual(deps[0], {package:'foo', version: '>= 1.2.3'});
    t.deepEqual(deps[1], {package:'bar'});
});
