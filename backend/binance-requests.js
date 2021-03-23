const Binance = require('node-binance-api');
const utils = require('./utils');
// const { reject } = require('core-js/fn/promise');
// https://www.npmjs.com/package/node-binance-api

const binanceRequests = class {

  constructor() {
    this.binance = new Binance().options({
      // main account renddrew@gmail.com
      // APIKEY: 'i4dMaSxv6iCaZSR8tPUJCQxBmfJVOYRG37enQJHMHMx05JKDSLIdAFX7hxQOo09M',
      // APISECRET: 'f8Y0HqCDu8lFpXOhvuNYGafmd2t27IRmFJqctXsFhjM91gbbP0GuN2HLuD206CPt'
    
      // bot trade account rend.drew@gmail.com
      APIKEY: 'D9KzEBG6N23khpUqIRy0hM9EWwU9Ix7sF7lEUBspCcWaQZgLtVHTZOuZVPfOhUFe',
      APISECRET: 'rNA1bvQ3S4FJFmJ1Rn2239JLUjSwLx5K9nQGZ6OWN2AEM1BtynHUfq38Y6Lxdvad'
    }); 
  }

  getLastTrade(pair) {
    return new Promise((resolve) => {
      this.binance.trades(pair, (error, trades, symbol) => {
        trades = trades.sort((a, b) => {
          return b.time - a.time;
        });
        resolve(trades[0]);
      });
    });
  }

  getTrades(pair) {
    return new Promise((resolve) => {
      this.binance.trades(pair, (error, trades, symbol) => {

        if (!Array.isArray(trades)) {
          resolve({ trades: [], tradesAll: [] });
          return;
        }

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
  }

  getBalances() {
    return new Promise((resolve) => {
      this.binance.balance((error, balances) => {
        resolve(balances);
      });
    });
  }

  getPrice(pair) {
    return new Promise((resolve) => {
      this.binance.prices(pair, (error, ticker) => {
        if (ticker && ticker[pair]) {
          resolve(ticker[pair]);
        } else {
          resolve(0);
        }
      });
    });
  }

  marketBuy(qty, pair) {
    return new Promise(async(resolve, reject) => {
      // change to if no qty provided, get balances and trade full balance
      if (!pair) {
        resolve('pair required');
        return;
      }
      if (!qty) {
        const balances = await this.getBalances();
        const price = await this.getPrice(pair);
        const usdt = balances.USDT && balances.USDT.available ? parseFloat(balances.USDT.available) : 0;
        if (!price || !usdt) {
          resolve('Failed, please retry or check balance');
          return;
        }
        const coinValue = usdt / parseFloat(price);
        // reduce by %1 to allow for flucutating price
        qty = coinValue * 0.99;
      }
      if (!qty) {
        resolve('Problem calculating trade amount');
        return;
      }

      // format precision
      let precision = 6; //btcusdt
      if (pair === 'ADAUSDT') {
        precision = 1;
      }

      qty = utils.formatNum(qty, precision);

      this.binance.marketBuy(pair, qty, (error, response) => {
        if (response.status === 'FILLED') {
          resolve('buy');
          return;
        }
        resolve(error.body);
        console.log(error);
      });
    });
  }

  marketSell(qty, pair) {
    return new Promise(async(resolve) => {
      if (!pair) {
        resolve('pair required');
        return;
      }
      
      if (pair.substr(-4) !== 'USDT') {
        resolve('Must be USDT pair');
        return;
      }
      // remove USDT from pair to get coin
      const coin = pair.substring(-3, 3)

      if (!qty) {
        const balances = await this.getBalances();

        let coinVal = balances[coin] && balances[coin].available ? parseFloat(balances[coin].available) : 0;
        if (!coinVal) {
          resolve('Failed, please retry or check balance');
          return;
        }
        coinVal = parseFloat(coinVal);
        // reduce by %1 to allow for flucutating price
        qty = coinVal * 0.99;
      }
      if (!qty) {
        resolve('Problem calculating trade amount');
        return;
      }

      // format precision
      let precision = 6; //btcusdt
      if (pair === 'ADAUSDT') {
        precision = 1;
      }

      // format precision
      qty = utils.formatNum(qty, precision);

      this.binance.marketSell(pair, qty, (error, response) => {
        if (response.status === 'FILLED') {
          resolve('sell');
          return;
        }
        resolve(error.body);
        console.log(error);
      });
    });
  }
}

module.exports = binanceRequests;
