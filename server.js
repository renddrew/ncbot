const WSServer = require('ws').Server;
const server = require('http').createServer();
const Binance = require('node-binance-api');
const app = require('./http-server');
const utils = require('./backend/utils');

// https://stackoverflow.com/questions/34808925/express-and-websocket-listening-on-the-same-port/34838031

// Create web socket server on top of a regular http server
// IMPORTANT declare port elsewhere to avoid erris with port un use for both servers
const wss = new WSServer({
  server,
});

// Also mount the app here
server.on('request', app);

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
  data = utils.formatNum(last, 2);
});

wss.on('connection', ws => {
  wss.clients.forEach(client => {
    setInterval(() => {
      client.send(JSON.stringify(data));
    }, 50);
  });
  // ws.on('message', incoming(data => {
  // });
});

server.listen(process.env.PORT, function() {
  console.log(`http/ws server listening on 8080`);
});
