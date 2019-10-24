
## rdesc-parser

> Parse R package DESCRIPTION files

## Examples

### Parse `DESCRIPTION` stream

```js
var rdesc = require('rdesc-parser');
stream = fs.createReadStream('DESCRIPTION');
rdesc(stream, function(err, d) {
  if (err) throw(err);
  console.log(d);
})
```

```json
{ Package: 'sysreqs',
  Title: 'Install SystemRequirements of Packages',
  Version: '1.0.0.9000',
  Author: 'Gábor Csárdi',
  Maintainer: 'Gábor Csárdi <csardi.gabor@gmail.com>',
  Description:
   'Automatically download and install system requirements of R packages.',
  License: 'MIT + file LICENSE',
  LazyData: 'true',
  URL: 'https://github.com/r-hub/sysreqs',
  BugReports: 'https://github.com/r-hub/sysreqs/issues',
  RoxygenNote: '6.1.1',
  Suggests: [ 'testthat' ],
  Imports: [ 'debugme', 'desc', 'jsonlite', 'processx', 'utils' ],
  Encoding: 'UTF-8',
  Roxygen: 'list(markdown = TRUE)' }
```

### Parse `DESCRIPTION` file

```js
var rdesc = require('rdesc-parser');
rdesc.parse_desc_file('./DESCRIPTION', function(err, d) {
  if (err) throw(err);
  console.log(d);
})
```

### Parse `DESCRIPTION` from a package stream

It supports `.tar.gz`, `.tar` and `.zip` files.

```js
var rdesc = require('rdesc-parser');
stream = fs.createReadStream('./test/foobar_1.0.0.tar.gz');
rdesc.parse_stream(stream, function(err, d) {
  if (err) throw(err);
  console.log(d);
})
```

### Parse `DESCRIPTION` from a package file

It supports `.tar.gz`, `.tar` and `.zip` files.

```js
var rdesc = require('rdesc-parser');
rdesc.parse_file('./test/foobar_1.0.0.zip', function(err, d) {
  if (err) throw(err);
  console.log(d);
})
```

## License

ISC @ R Consortium

This repo is part of the R-hub project, supported by
the R Consortium.
