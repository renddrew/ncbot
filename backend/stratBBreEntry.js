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
  constructor() {
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

  async detectEntryMinute() {
    let doBuy = false;
    let doSell = false;
    this.ranges = new GetRanges();
    const bbMuliplier = 1;
    const timeFrameBasisKey = 'min5';

    const { tradeLog } = this.tl;
    tradeLog.strategy = 'BB Re-Entry min5';
    tradeLog.ts = (new Date()).getTime();

    const closeVals = this.ranges.getLastBB(moment().startOf('minute'), bbMuliplier);
    const prevCloseMin = moment().startOf('minute').subtract(1, 'minute');
    const prevCloseVals = this.ranges.getLastBB(prevCloseMin, bbMuliplier);

    tradeLog.indicators = closeVals;
    tradeLog.t = closeVals.min1.t;
    tradeLog.p = closeVals.min1.p;

    const closeUpperBB = closeVals[timeFrameBasisKey].bbUpper;
    const closeLowerBB = closeVals[timeFrameBasisKey].bbLower;
    const prevCloseUpperBB = prevCloseVals[timeFrameBasisKey].bbUpper;
    const prevCloseLowerBB = prevCloseVals[timeFrameBasisKey].bbLower;

    // open price is price of minute observed
    // close price is close second price
    const openPrice = closeVals.min1.p;
    const prevClosePrice = prevCloseVals.min1.p;

    let enableTrading = this.enableTrading;

    // disable trading if MA too low for time period
    if (closeVals[timeFrameBasisKey].maLen < 15) {
      enableTrading = false;
    }

    // upper re-entry condition
    let upperReEntry = false;
    if (openPrice < closeUpperBB && prevClosePrice > prevCloseUpperBB) {
      upperReEntry = true;
      tradeLog.triggerDetails = 'Upper ReEntry';
    }

    let lowerReEntry = false;
    if (openPrice > closeLowerBB && prevClosePrice < prevCloseLowerBB) {
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
