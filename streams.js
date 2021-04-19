const { PassThrough } = require("stream");

const pipe = require("it-pipe");
const lp = require("it-length-prefixed");

const { map } = require("streaming-iterables");

function writeStream(stream) {
  const writer = new PassThrough();
  pipe(writer, lp.encode(), stream.sink);
  return writer;
}

function readStream(stream) {
  return pipe(
    stream.source,
    lp.decode(),
    map((msg) => msg.slice())
  );
}

module.exports = {
  writeStream,
  readStream,
};
