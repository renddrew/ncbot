const StormDB = require('stormdb');
const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs');
const utils = require('./utils');
const { timeStamp } = require('console');
const GetRanges = require('./get-ranges');
const binanceRequests = require('./binance-requests');
const AppSettings = require('./app-settings');
const TradeLog = require('./trade-log');
const { settings } = require('cluster');

moment.tz.setDefault("Africa/Abidjan"); // set UTC 0

const stratBBreEntry = class {

  constructor () {
    cron.schedule('* * * * *', async () => {
      this.tl = new TradeLog();
      this.enableTrading = false;
      const sdb = new AppSettings();
      const appSettings = sdb.getSettings();
      if (appSettings && appSettings.autoTrade === 'on') {
        this.enableTrading = true;
      }
      await this.detectEntryMinute();
    });
  }

  async detectEntryMinute () {
    let enableTrading = this.enableTrading;
    let doBuy = false;
    let doSell = false;
    
    let bbMuliplier = 1.5;
    let bbMuliplierLower = 1.5;

    const timeFrameMins = 1;
    
    this.ranges = new GetRanges();

    if (this.ranges.periodHistory.shortUptrend) {
      bbMuliplierLower = -0.5;
    }
    if (!this.ranges.periodHistory.shortUptrend) {
      bbMuliplier = -0.5;
    }

    // get default tradelog object to assign to
    const { tradeLog } = this.tl;
    tradeLog.strategy = `BB Re-Entry ${timeFrameMins} timeframe`;
    tradeLog.ts = (new Date()).getTime();

    const timeList = this.ranges.getTimeList(timeFrameMins, 20);
    const lastClose = this.ranges.calcBB(timeList, bbMuliplier, bbMuliplierLower);
    const lastCloseTime = moment().startOf('minute').subtract(timeFrameMins, 'minute');
    const timeListPrev = this.ranges.getTimeList(timeFrameMins, 20, lastCloseTime);
    const prevClose = this.ranges.calcBB(timeListPrev, bbMuliplier, bbMuliplierLower);
  
    tradeLog.indicators = lastClose;
    tradeLog.t = lastClose.t;
    tradeLog.p = lastClose.p;

    // disable trading if MA too low for time period
    if (lastClose.maLen < 15 || prevClose.maLen < 15) {
      enableTrading = false;
    }

    // upper re-entry condition
    let upperReEntry = false;
    if (lastClose.p < lastClose.bbUpper && prevClose.p > prevClose.bbUpper) {
      upperReEntry = true;
      tradeLog.triggerDetails = 'Upper ReEntry';
    }

    let lowerReEntry = false;
    if (lastClose.p > lastClose.bbLower && prevClose.p < prevClose.bbLower) {
      lowerReEntry = true;
      tradeLog.triggerDetails = 'Lower ReEntry';
    }

    // Ideas:
    // 1.
    // add condition to only sell if crossing the MA if short and medium uptrend
    // add condition to only buy if crossing the MA if short and medium downtrend

    // 2.
    // adjust standard deviation according to uptrend and downtrend. if uptrend decrease lower stdDev andn increase upper to result in having the system buy sooner and sell later 
    // probably need to rewrite helper funcs to separate getting MA, getting BB in order to use directly within strategies for more options

    // 3.
    // add stoploss buy/sell action - when price is in a medium and short trend, do the buy or sell

    if (lowerReEntry) {
      doBuy = true;
      tradeLog.trigger = 'Buy';
    } else if (upperReEntry) {
      doSell = true;
      tradeLog.trigger = 'Sell';
    }

    if (doBuy || doSell) {
      const balances = await binanceRequests.getBalances();
      const balanceBTC = balances && balances.BTC.available ? parseFloat(balances.BTC.available) : 0;
      const balanceUSDT = balances && balances.USDT.available ? parseFloat(balances.USDT.available) : 0;
      tradeLog.balances.btc = balanceBTC;
      tradeLog.balances.usdt = balanceUSDT;
      if (doBuy) {
        if (enableTrading && balanceUSDT > 11) {
          const buyRes = await binanceRequests.marketBuy();
          if (buyRes === 'buy') {
            tradeLog.action = 'BUY';
          }
        }
      } else {
        if (enableTrading && balanceBTC > 0.0002) {
          const sellRes = await binanceRequests.marketSell();
          if (sellRes === 'sell') {
            tradeLog.action = 'SELL';
          }
        }
      }
    }
    this.tl.addTradeLog(tradeLog);

    if (tradeLog.action) {
      console.log(tradeLog);
    }

    console.log({t: tradeLog.t, enableTrading});
  }
};

module.exports = stratBBreEntry;
