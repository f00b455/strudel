const OSC = require('osc-js');

const config = {
  receiver: 'ws', // @param {string} Where messages sent via 'send' method will be delivered to, 'ws' for Websocket clients, 'udp' for udp client
  udpServer: {
    host: 'localhost', // @param {string} Hostname of udp server to bind to
    port: 57120, // @param {number} Port of udp client for messaging
    exclusive: false, // @param {boolean} Exclusive flag
  },
  udpClient: {
    host: 'localhost', // @param {string} Hostname of udp client for messaging
    // port: 57120, // @param {number} Port of udp client for messaging
    port: 41235, // @param {number} Port of udp client for messaging
  },
  wsServer: {
    host: 'localhost', // @param {string} Hostname of WebSocket server
    port: 8080, // @param {number} Port of WebSocket server
  },
};
const osc = new OSC({ plugin: new OSC.BridgePlugin(config) });

osc.open(); // start a WebSocket server on port 8080

console.log('osc client running on port', config.udpClient.port);
console.log('osc server running on port', config.udpServer.port);
console.log('websocket server running on port', config.wsServer.port);

// listen for messages from the client
osc.on('*', (m) => {
  console.log('received:', m.address, m.args);
});

/*
example tidal messages:

/*

received: /dirt/play [
  '_id_',
  '1',
  'cps',
  0.5625,
  'cycle',
  503.5,
  'delta',
  0.8888888359069824,
  'orbit',
  0,
  's',
  'bd'
]
received: /dirt/play [
  '_id_',  '1',
  'cps',   0.5625,
  'cycle', 503.6666564941406,
  'delta', 0.592592716217041,
  'orbit', 0,
  's',     'hh'
]
received: /dirt/play [
  '_id_',
  '1',
  'cps',
  0.5625,
  'cycle',
  504,
  'delta',
  0.8888888359069824,
  'orbit',
  0,
  's',
  'bd'
]
received: /dirt/play [
  '_id_',
  '1',
  'cps',
  0.5625,
  'cycle',
  504,
  'delta',
  0.592592716217041,
  'orbit',
  0,
  's',
  'hh'
]
received: /dirt/play [
  '_id_',
  '1',
  'cps',
  0.5625,
  'cycle',
  504.3333435058594,
  'delta',
  0.5925922393798828,
  'orbit',
  0,
  's',
  'hh'
]
received: /dirt/play [
  '_id_',
  '1',
  'cps',
  0.5625,
  'cycle',
  504.5,
  'delta',
  0.8888888359069824,
  'orbit',
  0,
  's',
  'bd'
]
received: /dirt/play [
  '_id_',  '1',
  'cps',   0.5625,
  'cycle', 504.6666564941406,
  'delta', 0.592592716217041,
  'orbit', 0,
  's',     'hh'
]

*/
