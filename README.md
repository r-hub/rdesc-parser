
## rdesc-parser

> Parse R package DESCRIPTION files

## Examples

### Parsing files and streams

This package can parse DESCRIPTION from a file or a stream:

 - `parse_stream(stream)`
 - `parse_file(path)`

Both functions return a promise and auto-detect the input format using the magic byte. We support 5 types:

 - `text/plain`: plain-text file in dcf format (i.e. raw DESCRIPTION file)
 - `application/zip`: zip archive containing one file named `DESCRIPTION`
 - `application/gzip`: tar.gz archive containing one file named `DESCRIPTION`
 - `application/zstd`: tar.zstd archive containing one file named `DESCRIPTION`
 - `other`: uncomprssed tarball archive containing one file named `DESCRIPTION`


```js
// npm install rdesc-parser
let { parse_stream } = await import("rdesc-parser");
let stream = fs.createReadStream('DESCRIPTION');
var desc = await parse_stream(stream);
desc
```

We get same result by reading the file directly:

```js
let { parse_file } = await import("rdesc-parser");
var desc = await parse_file('DESCRIPTION');
desc
````

```js
{
  Package: 'sysreqs',
  Title: 'Install SystemRequirements of Packages',
  Version: '1.0.0.9000',
  Author: 'Gabor Csardi',
  Maintainer: 'Gabor Csardi <csardi.gabor@gmail.com>',
  Description: 'Automatically download and install system requirements of R packages.',
  License: 'MIT + file LICENSE',
  LazyData: 'true',
  URL: 'https://github.com/r-hub/sysreqs',
  BugReports: 'https://github.com/r-hub/sysreqs/issues',
  RoxygenNote: '5.0.1.9000',
  Suggests: [ { package: 'testthat' } ],
  Imports: [ { package: 'debugme' }, { package: 'desc' }, { package: 'utils' } ]
}
```

### Parsing from package files

The same interface is used for `tar.zstd`, `.tar.gz`, `.tar` and `.zip` package files.

```js
let { parse_file } = await import("rdesc-parser");
var desc = await parse_file('curl_7.0.0.tar.gz');
desc
````

We can use `parse_stream` to read a DESCRIPTION directly from an internet stream:

```js
let { Readable } = await import( "stream");
let { parse_stream } = await import("rdesc-parser");
let response = await fetch('https://cran.r-project.org/src/contrib/Archive/curl/curl_6.0.0.tar.gz');
var desc = parse_stream(Readable.fromWeb(response.body));
desc
```

## License

ISC @ Gábor Csárdi

This repo is part of the R-hub project
