let express = require('express');
let app = express();
var cors = require('cors');
app.use(cors());

const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: 'i4dMaSxv6iCaZSR8tPUJCQxBmfJVOYRG37enQJHMHMx05JKDSLIdAFX7hxQOo09M',
  APISECRET: 'f8Y0HqCDu8lFpXOhvuNYGafmd2t27IRmFJqctXsFhjM91gbbP0GuN2HLuD206CPt'
});

// Let's create the regular HTTP request and response
app.get('/', function (req, res) {
  res.send('hello workld')
  return;
});

app.post('/getTrades', function(req, res) {
  binance.trades("BTCUSDT", (error, trades, symbol) => {

    trades = trades.sort((a, b) => {
      return b.time - a.time;
    })

    /*
      "price":"36307.84000000",
      "qty":"0.00633600",
      "quoteQty":"230.04647424",
      "commission":"0.00390875",
      "commissionAsset":"BNB",
      "time":1610980772825,
    */

    let lastTradeId = null;
    
    // for (let i = 0; i < trades.length; i++) {
    //   if (lastTradeId == trades[i].orderId) {
    //     groupedTrade.price = (groupedTrade.price + trades[i].price) / 2)
    //   } else {
    //     let groupedTrade = trades[i];
    //   }
    //   lastTradeId = trades[i].orderId;
      
    // }


    res.send({trades})
    //console.info(symbol+" trade history", trades)
    return;;
  });
});

module.exports = app;