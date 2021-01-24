const WSServer = require('ws').Server;
const server = require('http').createServer();
const Binance = require('node-binance-api');
const app = require('./http-server');
const utils = require('./backend/utils');
const SavePriceHistory = require('./backend/save-price-history');
const GetRanges = require('./backend/get-ranges');

// https://stackoverflow.com/questions/34808925/express-and-websocket-listening-on-the-same-port/34838031

// https://www.npmjs.com/package/node-binance-api

// https://www.npmjs.com/package/stormdb


// Create web socket server on top of a regular http server
// IMPORTANT declare port elsewhere to avoid erris with port un use for both servers
const wss = new WSServer({
  server
});

// Also mount the app here
server.on('request', app);

const binance = new Binance().options({
  APIKEY: 'i4dMaSxv6iCaZSR8tPUJCQxBmfJVOYRG37enQJHMHMx05JKDSLIdAFX7hxQOo09M',
  APISECRET: 'f8Y0HqCDu8lFpXOhvuNYGafmd2t27IRmFJqctXsFhjM91gbbP0GuN2HLuD206CPt'
});

// binance.bookTickers('BTCUSDT', (error, ticker) => {
//   console.info("bookTickers", ticker);
// });

let lastPrice = '22';
binance.websockets.chart('BTCUSDT', '1m', (symbol, interval, chart) => {
  const tick = binance.last(chart);
  const last = chart[tick].close;
  // console.info(chart);
  // Optionally convert 'chart' object to array:
  // let ohlc = binance.ohlc(chart);
  // console.info(symbol, ohlc);
  // console.info(symbol+" last price: "+last)
  lastPrice = utils.formatNum(last, 2);
});

wss.on('connection', (ws) => {
  wss.clients.forEach((client) => {
    setInterval(() => {
      client.send(JSON.stringify({ lastPrice }));
    }, 50);
  });
  // ws.on('message', incoming(data => {
  // });
});

server.listen(process.env.PORT, () => {
  console.log('http/ws server listening on 8080');
});

// save price history
const ph = new SavePriceHistory();
setInterval(() => {
  ph.addPriceHistory(lastPrice);
}, 1000);

const ranges = new GetRanges();

