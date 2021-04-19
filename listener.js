const Libp2p = require("libp2p");
const TCP = require("libp2p-tcp");
const { NOISE } = require("libp2p-noise");
const MPLEX = require("libp2p-mplex");

const PeerId = require("peer-id");

const { readStream, writeStream } = require("./streams");

(async () => {
  const peerId = await PeerId.createFromJSON(require("./peer-id-listener"));
  const node = await Libp2p.create({
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/10333"],
    },
    modules: {
      transport: [TCP],
      connEncryption: [NOISE],
      streamMuxer: [MPLEX],
    },
    peerId,
  });

  node.handle("/close/1.0.0", async ({ stream }) => {
    try {
      const reader = readStream(stream);
      const writer = writeStream(stream);

      const close = () => {
        console.log("Received invalid message");
        stream.close();
      };

      // Read syn
      const { value: syn } = await reader.next();
      if (syn !== "syn") {
        close();
        return;
      }

      // Write synack and close write stream
      writer.write("synAck");
      await stream.closeWrite();

      // Read ack and close read stream
      const { value: ack } = await reader.next();
      if (ack !== "ack") {
        close();
        return;
      }
      await stream.closeRead();

      console.log(stream.timeline);
    } finally {
      await node.stop();
    }
  });

  await node.start();
})();
