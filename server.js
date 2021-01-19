let WSServer = require('ws').Server;
let server = require('http').createServer();
let app = require('./http-server');

//https://stackoverflow.com/questions/34808925/express-and-websocket-listening-on-the-same-port/34838031

// Create web socket server on top of a regular http server
// IMPORTANT declare port elsewhere to avoid erris with port un use for both servers
let wss = new WSServer({
  server: server,
});

// Also mount the app here
server.on('request', app);

const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: 'i4dMaSxv6iCaZSR8tPUJCQxBmfJVOYRG37enQJHMHMx05JKDSLIdAFX7hxQOo09M',
  APISECRET: 'f8Y0HqCDu8lFpXOhvuNYGafmd2t27IRmFJqctXsFhjM91gbbP0GuN2HLuD206CPt'
});

// binance.bookTickers('BTCUSDT', (error, ticker) => {
//     console.info("bookTickers", ticker);
// });

let data = 'balls';

binance.websockets.chart("BTCUSDT", "1m", (symbol, interval, chart) => {
  let tick = binance.last(chart);
  const last = chart[tick].close;
  // console.info(chart);
  // Optionally convert 'chart' object to array:
  // let ohlc = binance.ohlc(chart);
  // console.info(symbol, ohlc);
  // console.info(symbol+" last price: "+last)
  data = last;
});

wss.on('connection', function connection (ws) {
  // ws.on('message', function incoming(data) {
    wss.clients.forEach(function each(client) {
     // if (client.readyState === WebSocket.OPEN) {
        setInterval(() => {
          client.send(JSON.stringify(data));
        }, 200);
     // }
    });
  // });git 
});

server.listen(process.env.PORT, function() {
  console.log(`http/ws server listening on 8080`);
});
