const Libp2p = require("libp2p");
const TCP = require("libp2p-tcp");
const { NOISE } = require("libp2p-noise");
const MPLEX = require("libp2p-mplex");

const PeerId = require("peer-id");
const { multiaddr } = require("multiaddr");

const { readStream, writeStream } = require("./streams");

(async () => {
  const [peerId, listenerPeerId] = await Promise.all([
    PeerId.createFromJSON(require("./peer-id-dialer")),
    PeerId.createFromJSON(require("./peer-id-listener")),
  ]);
  const node = await Libp2p.create({
    modules: {
      transport: [TCP],
      connEncryption: [NOISE],
      streamMuxer: [MPLEX],
    },
    peerId,
  });

  const listenerMa = multiaddr(
    `/ip4/127.0.0.1/tcp/10333/p2p/${listenerPeerId.toB58String()}`
  );
  const { stream } = await node.dialProtocol(listenerMa, "/close/1.0.0");

  const reader = readStream(stream);
  const writer = writeStream(stream);

  // Write syn
  await writer.write("syn");

  // Read synack and close read steram
  await reader.next();
  await stream.closeRead();

  // Write ack
  await writer.write("ack");
  await stream.closeWrite();

  console.log(stream.timeline);
})();
