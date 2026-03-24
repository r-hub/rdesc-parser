import rConstants from "r-constants";
import byline from "byline";
import fs from "node:fs";
import filetype from "file-type";
import tar from "tar-stream";
import zlib from "node:zlib";
import unzip from "unzipper";
import stream from "node:stream";

const deps = rConstants.dependency_types;

function normalize_ws(x) {
  return x.trim().replace(/\s/g, " ");
}

function parse_desc_stream(descstream, callback) {
  var descstream = byline(descstream, { keepEmptyLines: true });
  var desc = {};
  var current = "";
  var first = true;

  descstream.setEncoding("utf8");

  function reader(line) {
    // First line is special
    if (first) {
      current = line;
      first = false;

      // Starts with space, same record, append
    } else if (line.match(/^\s/)) {
      current = current + "\n" + line.trim();

      // New record, need to emit the previous one
    } else {
      var rec = split_record(current);
      if (rec.key === "") {
        // No way to close a stream, we just remove the listeners
        // if an error happens
        descstream.removeListener("data", reader);
        descstream.removeListener("end", finisher);
        return callback("Invalid record: " + rec.value);
      }
      if (deps.indexOf(rec.key) > -1) {
        rec.value = parse_dep_string(rec.value);
      }
      if (rec.key == "Remotes") {
        rec.value = parse_remotes(rec.value);
      }
      if (rec.key == "Built") {
        rec.value = parse_built(rec.value);
      }
      if (rec.key == "Packaged") {
        rec.value = parse_packaged(rec.value);
      }
      desc[rec.key] = rec.value;
      current = line;
    }
  }

  function finisher() {
    callback(null, desc);
  }

  descstream.on("data", reader);
  descstream.on("end", finisher);
}

function parse_dep_string(str) {
  return str
    .split(/,[\s]*/s)
    .filter(function (str) {
      return str.trim(); //filter out empty strings
    })
    .map(function (str) {
      return str.match(/\(.+\)/s)
        ? {
            package: normalize_ws(str.replace(/\(.+\)/s, "")),
            version: normalize_ws(str.replace(/.*\((.+)\)/s, "$1")),
          }
        : {
            package: normalize_ws(str),
          };
    });
}

function parse_remotes(str) {
  return str.split(/,[\s]*/);
}

function parse_built(str) {
  var built = str.split(/;[\s]*/);
  return {
    R: built[0].replace(/^R /, ""),
    Platform: built[1],
    Date: built[2],
    OStype: built[3],
  };
}

function parse_packaged(str) {
  var packaged = str.split(/;[\s]*/);
  return {
    Date: packaged[0],
    User: packaged[1],
  };
}

function split_record(str) {
  var colon = str.indexOf(":");
  return {
    key: str.substr(0, colon).trim(),
    value: str.substr(colon + 1).trim(),
  };
}

function parse_desc_file(path, callback) {
  var descstream = fs.createReadStream(path);
  parse_desc_stream(descstream, callback);
}

function parse_stream(descstream, callback) {
  filetype.stream(descstream).then(function (x) {
    // For no type it is assumed a plain text file
    if (x.fileType === undefined) {
      return parse_desc_stream(x, callback);
    }

    // The type of file
    var mime = x.fileType.mime;

    // .zip file
    if (mime === "application/zip") {
      return parse_zip_stream(x, callback);
    }

    // .tar.gz file
    if (mime === "application/gzip") {
      return parse_raw_tar_stream(x.pipe(zlib.createGunzip()), callback);
    }

    if (mime === "application/zstd") {
      return parse_raw_tar_stream(
        x.pipe(zlib.createZstdDecompress()),
        callback,
      );
    }

    // Default is assuming no compression
    return parse_raw_tar_stream(x, callback);
  });
}

function parse_raw_tar_stream(input, callback) {
  var extract = tar.extract();
  var done = false;

  extract.on("entry", function (header, tarstream, tarcb) {
    tarstream.on("end", tarcb);
    tarstream.on("error", function (err) {
      done = true;
      callback(err);
    });
    if (!done && header.name.match(/^[^\/]+\/DESCRIPTION$/)) {
      done = true;
      parse_desc_stream(tarstream, function (err, d) {
        callback(err, d);
      });
    } else {
      tarstream.resume();
    }
  });

  extract.on("finish", function () {
    if (!done) {
      callback("No DESCRIPTION file in tar archive");
    }
  });

  extract.on("error", function (err) {
    callback(err);
  });

  input.pipe(extract);
}

function parse_zip_stream(descstream, callback) {
  descstream.pipe(unzip.Parse()).on("entry", function (entry) {
    const fileName = entry.path;
    if (fileName.match(/^[^\/]+\/DESCRIPTION$/)) {
      parse_desc_stream(entry, function (err, cb) {
        callback(err, cb);
      });
    } else {
      entry.autodrain();
    }
  });
}

function parse_file(path, callback) {
  var descstream = fs.createReadStream(path);
  return parse_stream(descstream, callback);
}

export default parse_desc_stream;
export {
  parse_desc_file,
  parse_file,
  parse_stream,
  parse_zip_stream,
  parse_dep_string,
  // Backward compatibility
  parse_file as parse_zip_file,
  parse_file as parse_tar_file,
  parse_stream as parse_tar_stream,
};
