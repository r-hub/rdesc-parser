import test from "ava";
import fs from "node:fs";
import { promisify } from "node:util";
import parseDescStream, {
  parse_desc_file,
  parse_stream,
  parse_file,
  parse_dep_string,
} from "./index.js";

const desc = promisify(parseDescStream);
desc.parse_desc_file = promisify(parse_desc_file);
desc.parse_stream = promisify(parse_stream);
desc.parse_file = promisify(parse_file);
desc.parse_dep_string = parse_dep_string;

test("D1", async function (t) {
  let s = fs.createReadStream("./test/D1", { encoding: "utf8" });
  let d = await desc(s);
  t.is(d.Package, "parr");
  t.is(d.Maintainer, "Gabor Csardi <csardi.gabor@gmail.com>");
  t.is(d.RoxygenNote, "5.0.1");
});

test("D2", async function (t) {
  let s = fs.createReadStream("./test/D2", { encoding: "utf8" });
  let d = await desc(s);
  t.is(d.Package, "roxygen2");
  t.is(d.Depends.length, 1);
  t.is(d.Imports.length, 8);
  t.deepEqual(d.Depends[0], { package: "R", version: ">= 3.0.2" });
  t.deepEqual(d.Imports[0], { package: "stringr", version: ">= 0.5" });
  t.deepEqual(d.Imports[1], { package: "stringi" });
  t.deepEqual(d.Imports[5], { package: "Rcpp", version: ">= 0.11.0" });
  t.deepEqual(d.Suggests[0], { package: "testthat", version: ">= 0.8.0" });
});

test("D3", async function (t) {
  await t.throwsAsync(
    desc(fs.createReadStream("./test/D3", { encoding: "utf8" })),
    { any: true },
    "Invalid record: ",
  );
});

test("parse_desc_file", async function (t) {
  let d = await desc.parse_desc_file("./test/D1");
  t.is(d.Package, "parr");
  t.is(d.Maintainer, "Gabor Csardi <csardi.gabor@gmail.com>");
  t.is(d.RoxygenNote, "5.0.1");
});

test("parse_stream, tarball", async function (t) {
  let d = await desc.parse_stream(
    fs.createReadStream("./test/foobar_1.0.0.tar"),
  );
  t.is(d.Package, "foobar");
  t.is(d.RoxygenNote, "6.0.1");
});

test("parse_stream, gzipped", async function (t) {
  let d = await desc.parse_stream(
    fs.createReadStream("./test/foobar_1.0.0.tar.gz"),
  );
  t.is(d.Package, "foobar");
  t.is(d.RoxygenNote, "6.0.1");
});

test("parse_file, tarball", async function (t) {
  let d = await desc.parse_file("./test/foobar_1.0.0.tar");
  t.is(d.Package, "foobar");
  t.is(d.RoxygenNote, "6.0.1");
});

test("parse_file, gzipped", async function (t) {
  let d = await desc.parse_file("./test/foobar_1.0.0.tar.gz");
  t.is(d.Package, "foobar");
  t.is(d.RoxygenNote, "6.0.1");
});

test("parse_stream, zip", async function (t) {
  let d = await desc.parse_stream(
    fs.createReadStream("./test/foobar_1.0.0.zip"),
  );
  t.is(d.Package, "foobar");
  t.is(d.RoxygenNote, "6.0.1");
});

test("parse_file, zipped", async function (t) {
  let d = await desc.parse_file("./test/foobar_1.0.0.zip");
  t.is(d.Package, "foobar");
  t.is(d.RoxygenNote, "6.0.1");
});

test("parse_file, plain file", async function (t) {
  let d = await desc.parse_file("./test/D1");
  t.is(d.Package, "parr");
  t.is(d.Maintainer, "Gabor Csardi <csardi.gabor@gmail.com>");
  t.is(d.RoxygenNote, "5.0.1");
});

test("parse_file, tar file", async function (t) {
  let d = await desc.parse_file("./test/foobar_1.0.0.tar");
  t.is(d.Package, "foobar");
  t.is(d.RoxygenNote, "6.0.1");
});

test("parse_file, tar.gz file", async function (t) {
  let d = await desc.parse_file("./test/foobar_1.0.0.tar.gz");
  t.is(d.Package, "foobar");
  t.is(d.RoxygenNote, "6.0.1");
});

test("parse_file, tar.zstd file", async function (t) {
  let d = await desc.parse_file("./test/foobar_1.0.0.tar.zstd");
  t.is(d.Package, "foobar");
  t.is(d.RoxygenNote, "6.0.1");
});

test("parse_file, zip file", async function (t) {
  let d = await desc.parse_file("./test/foobar_1.0.0.zip");
  t.is(d.Package, "foobar");
  t.is(d.RoxygenNote, "6.0.1");
  t.is(d.Built.R, "3.4.3");
  t.is(d.Built.Platform, "");
  t.is(d.Built.Date, "2017-12-25 19:19:13 UTC");
  t.is(d.Built.OStype, "unix");
});

//webr packages have modified tarball trailing data
test("parse_file, webr tgz", async function (t) {
  let d = await desc.parse_file("./test/webr-package.tgz");
  t.is(d.Package, "sys");
  t.is(d.Built.R, "4.5.1");
  t.is(d.Built.Platform, "wasm32-unknown-emscripten");
});

test("parse dependency string", function (t) {
  var deps = desc.parse_dep_string("foo (>= 1.2.3), bar");
  t.deepEqual(deps[0], { package: "foo", version: ">= 1.2.3" });
  t.deepEqual(deps[1], { package: "bar" });
});

/* Test errors */

test('parse_file, does not exist', async function (t) {
  const error = await t.throwsAsync(() => {
    return desc.parse_file("./test/doesnotexist");
  });
  t.regex(error.message, /no such file/);
});


test('parse_file, unsupported format', async function (t) {
  const error = await t.throwsAsync(() => {
    return desc.parse_file("./test/foobar_1.0.0.tar.xz");
  });
  t.is(error.message, 'Invalid tar header. Maybe the tar is corrupted or it needs to be gunzipped?');
});

test('parse_file, no DESCRIPTION in tar', async function (t) {
  const error = await t.throwsAsync(() => {
    return desc.parse_file("./test/empty.tar.gz");
  });
  t.is(error.message, 'No DESCRIPTION file in tar archive');
});

test('parse_file, no DESCRIPTION in zip', async function (t) {
  const error = await t.throwsAsync(() => {
    return desc.parse_file("./test/empty.zip");
  });
  t.is(error.message, 'No DESCRIPTION file in zip file');
});

test('parse_file, wrong content', async function (t) {
  const error = await t.throwsAsync(() => {
    return desc.parse_file("./test/yolo.txt");
  });
  t.is(error.message, 'Invalid record: This is nothing');
});

test('parse_stream, truncated tar.gz', async function (t) {
  const error = await t.throwsAsync(() => {
    return desc.parse_stream(
      fs.createReadStream("./test/foobar_1.0.0.tar.gz", {start: 0, end: 200})
    );
  });
  t.is(error.message, 'unexpected end of file');
});

test('parse_stream, truncated tar.zstd', async function (t) {
  const error = await t.throwsAsync(() => {
    return desc.parse_stream(
      fs.createReadStream("./test/foobar_1.0.0.tar.zstd", {start: 0, end: 200})
    );
  });
  // createZstdDecompress does not seem to error about truncation?
  t.is(error.message, 'No DESCRIPTION file in tar archive');
});

test('parse_stream, truncated zip', async function (t) {
  const error = await t.throwsAsync(() => {
    return desc.parse_stream(
      fs.createReadStream("./test/foobar_1.0.0.zip", {start: 0, end: 200})
    );
  });
  t.is(error.message, 'FILE_ENDED');
});
