const StormDB = require('stormdb');
const WSServer = require('ws').Server;
const server = require('http').createServer();
const Binance = require('node-binance-api');
const app = require('./http-server');
const utils = require('./backend/utils');

// https://stackoverflow.com/questions/34808925/express-and-websocket-listening-on-the-same-port/34838031

// https://www.npmjs.com/package/node-binance-api

// Create web socket server on top of a regular http server
// IMPORTANT declare port elsewhere to avoid erris with port un use for both servers
const wss = new WSServer({
  server
});

// Also mount the app here
server.on('request', app);

const engine = new StormDB.localFileEngine('./backend/db/btcusdt/history.stormdb', {
  async: true,
});
const priceHistDb = new StormDB(engine);


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

function savePriceHistory() {
  priceHistDb.default({ history: [] });
  const time = (new Date()).getTime();
  priceHistDb.get('history').push({ t: time, p: lastPrice });
  priceHistDb.save(); // async
}

setInterval(savePriceHistory, 1000);


