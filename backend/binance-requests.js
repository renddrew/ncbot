const cors = require('cors');
const Binance = require('node-binance-api');
const utils = require('./utils');

const binance = new Binance().options({
  APIKEY: 'i4dMaSxv6iCaZSR8tPUJCQxBmfJVOYRG37enQJHMHMx05JKDSLIdAFX7hxQOo09M',
  APISECRET: 'f8Y0HqCDu8lFpXOhvuNYGafmd2t27IRmFJqctXsFhjM91gbbP0GuN2HLuD206CPt'
});

const binanceRequests = {

  getTrades() {
    return new Promise((resolve) => {
      binance.trades('BTCUSDT', (error, trades, symbol) => {

        trades = trades.sort((a, b) => {
          return b.time - a.time;
        });

        const filteredTrades = [];
        let lastTradeId = null;
        let groupedTrades = [];

        for (let i = 0; i < trades.length; i++) {

          if (i > 80) break;

          // always add item to grouped trades, whether has match or not yet

          if ((lastTradeId !== trades[i].orderId) && i !== 0) {

            // do averaging for each grouped trade item
            const averagedFromGroup = { price: 0, qty: 0, quoteQty: 0, commission: 0 };

            for (let gi = 0; gi < groupedTrades.length; gi++) {
              // add to averagedFromGroup properties
              averagedFromGroup.price += utils.formatNum(groupedTrades[gi].price, 2);
              averagedFromGroup.qty += utils.formatNum(groupedTrades[gi].qty, 6);
              averagedFromGroup.quoteQty += utils.formatNum(groupedTrades[gi].quoteQty, 2);
              averagedFromGroup.commission += utils.formatNum(groupedTrades[gi].commission, 6);
            }
            // do averaged from group division based on length of averagedFromGroup
            const tradeGroupAveraged = groupedTrades[0];

            tradeGroupAveraged.price = utils.formatNum(averagedFromGroup.price / groupedTrades.length, 2);
            tradeGroupAveraged.qty = utils.formatNum(averagedFromGroup.qty, 6);
            tradeGroupAveraged.quoteQty = utils.formatNum(averagedFromGroup.quoteQty, 2);
            tradeGroupAveraged.commission = utils.formatNum(averagedFromGroup.commission, 6);

            // push single grouped trade to filteredTrades
            filteredTrades.push(tradeGroupAveraged);

            // start new grouped trades set for next trade
            groupedTrades = [];
            groupedTrades.push(trades[i]);
          } else {
            // tradeId matches last
            groupedTrades.push(trades[i]);
          }
          lastTradeId = trades[i].orderId;
        }
        resolve({ trades: filteredTrades, tradesAll: trades });
      });
    });
  },

  syncTradeHist(groupedTrades) {

    /*
    return new Promise((resolve) => {
      const dateFileStr = './backend/db/tradeHist.stormdb';
      const dbEngine = new StormDB.localFileEngine(dateFileStr, {
        async: true,
      });
      const tradeDb = new StormDB(dbEngine);
      const savedTrades = tradeDb.get('trades').value();
      let missingTrades = [];

      for (let i = 0; i < groupedTrades.length; i++) {
        let hasSaved = false;
        for (let si = 0; si < savedTrades.length; si++) {
          if (groupedTrades[i].orderId === savedTrades[si]) {
            hasSaved = true;
          }
        }
        if (!hasSaved) {
          missingTrades.push(groupedTrades[i]);
        }
      }

      missingTrades.sort((a, b) => {
        return a.time > b.time;
      });

      /*
      const timeNow = new Date().getTime();
      if (missingTrades[missingTrades.length]).time > (timeNow + (60*1000)) {
        const balances = await getBalances();
        // calculate balance in USD using BTC and USDT and add to trade then add amount to trade stats
      }

      tradeDb.get('trades').push(missingTrades);
      await tradeDb.save();

      resolve();
    });
    */
  },

  getBalances() {
    return new Promise((resolve) => {
      binance.balance((error, balances) => {
        resolve(balances);
      });
    });
  }
}

module.exports = binanceRequests;
