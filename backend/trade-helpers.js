const AppSettings = require('./app-settings');
const binanceRequests = require('./binance-requests');

const TradeHelpers = class {

  tryTrade(trigger, pair) {
    return new Promise(async resolve => {

      if (pair.substr(-4) !== 'USDT') {
        resolve('Must be USDT pair');
        return;
      }
      // remove USDT from pair to get coin
      const coin = pair.substring(-3, 3)

      let action = 'NONE';
      let enableTrading = false;
      const sdb = new AppSettings();
      const appSettings = sdb.getSettings();
      if (appSettings && appSettings.autoTrade === 'on') {
        enableTrading = true;
      }

      const balances = await binanceRequests.getBalances();
      const balanceUSDT = balances && balances.USDT.available ? parseFloat(balances.USDT.available) : 0;
      let coinVal = balances[coin] && balances[coin].available ? parseFloat(balances[coin].available) : 0;

      balance

      if (trigger === 'buy') {
        if (enableTrading && balanceUSDT > 11) {
          const buyRes = await binanceRequests.marketBuy();
          if (buyRes === 'buy') {
            action = 'BUY';
          }
        }
      } else if (trigger === 'sell') {
        if (enableTrading && coinVal > 0.0002) {
          const sellRes = await binanceRequests.marketSell();
          if (sellRes === 'sell') {
            action = 'SELL';
          }
        }
      }

      const res = {
        action,
        enableTrading,
        balances: {
          coin: coinVal,
          usdt: balanceUSDT
        }
      }

      resolve(res);
    });
  }

  getLastTrade(pair) {
    return new Promise(async resolve => {
      binanceRequests.getLastTrade(pair).then((res) => {
        resolve(res);
      })
    });
  }

}

module.exports = TradeHelpers;





