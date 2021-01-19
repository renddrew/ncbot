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
// app.get('/', function (req, res) {
//   res.send('hello workld')
//   return;
// });

app.use(express.static('dist'))

app.post('/getTrades', (req, res) => {
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

    let filteredTrades = [];
    let lastTradeId = null;
    let groupedTrades = [];

    function formatNum(num, decimals) {
      return parseFloat(parseFloat(num).toFixed(decimals));
    }    
  
    for (let i = 0; i < trades.length; i++) {
      // always add item to grouped trades, whether has match or not yet
      groupedTrades.push(trades[i])
      let lastTrade = trades[i-1];

      if (lastTradeId != trades[i].orderId && i !== 0) {
        // do averaging for each grouped trade item
        let averagedFromGroup = {price: 0, qty: 0, quoteQty: 0, commission: 0}
        for (let gi = 0; gi < groupedTrades.length; gi++) {
          // add to averagedFromGroup properties
          averagedFromGroup.price += formatNum(lastTrade.price, 2);
          averagedFromGroup.qty += formatNum(lastTrade.qty, 6);
          averagedFromGroup.quoteQty += formatNum(lastTrade.quoteQty, 2);
          averagedFromGroup.commission += formatNum(lastTrade.commission, 6);
        }
        // do averaged from group division based on length of averagedFromGroup
        let tradeGroupAveraged = lastTrade;
        for (var prop in averagedFromGroup) {
          if (!averagedFromGroup.hasOwnProperty(prop)) continue;
          tradeGroupAveraged[prop] = averagedFromGroup[prop] / groupedTrades.length;
        }

        // push single grouped trade to filteredTrades
        filteredTrades.push(tradeGroupAveraged);
        groupedTrades = [];
      }

      lastTradeId = trades[i].orderId;
    }

    res.send({trades: filteredTrades, tradesAll: trades})
  });
});


module.exports = app;