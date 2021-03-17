const AppSettings = require('./app-settings');
const binanceRequests = require('./binance-requests');

const TradeHelpers = class {

  async tryTrade(trigger) {
    let action = 'NONE';
    let enableTrading = true;
    const sdb = new AppSettings();
    const appSettings = sdb.getSettings();
    if (appSettings && appSettings.autoTrade === 'on') {
      enableTrading = true;
    }

    const balances = await binanceRequests.getBalances();
    const balanceBTC = balances && balances.BTC.available ? parseFloat(balances.BTC.available) : 0;
    const balanceUSDT = balances && balances.USDT.available ? parseFloat(balances.USDT.available) : 0;
    if (trigger === 'buy') {
      if (enableTrading && balanceUSDT > 11) {
        const buyRes = binanceRequests.marketBuy();
        if (buyRes === 'buy') {
          action = 'BUY';
        }
      }
    } else if (trigger === 'sell') {
      if (enableTrading && balanceBTC > 0.0002) {
        const sellRes = await binanceRequests.marketSell();
        if (sellRes === 'sell') {
          action = 'SELL';
        }
      }
    }

    return {
      action,
      enableTrading,
      balances: {
        btc: balanceBTC,
        usdt: balanceUSDT
      }
    }
  }
}

module.exports = TradeHelpers;





