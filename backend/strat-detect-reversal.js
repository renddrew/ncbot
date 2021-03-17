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
const TradeHelpers = require('./trade-helpers');

moment.tz.setDefault("Africa/Abidjan"); // set UTC 0

const stratDetectRevesal = class {

  constructor () {
    cron.schedule('*/5 * * * * *', async () => {
      this.tl = new TradeLog();
      await this.detectReversal();
    });
  }

  async detectReversal () {
    let enableTrading = 'false';
    let trigger = '';
    const timeFrameMins = 1;
    this.ranges = new GetRanges();

    /*
      - compare the last 2 bars to the current one. 
      - remember the highest or lowest price in the last 2x timeframe unit
      - if the current price gets X percentage above or below, call reversal
      - X percentage could be weighted by volatility. 
      - could weight X percentage also by gain since last trade
    */

    let bbMuliplier = 1.5;
    let bbMuliplierLower = 1.5;

    if (this.ranges.periodHistory.shortUptrend) {
      bbMuliplierLower = -0.3;
    }
    if (!this.ranges.periodHistory.shortUptrend) {
      bbMuliplier = -0.3;
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
      trigger = 'buy';
    } else if (upperReEntry) {
      trigger = 'sell';
    }

    if (trigger) {
      const th = new TradeHelpers();
      const tradeResult = await th.tryTrade(trigger)
      tradeLog.trigger = trigger;
      tradeLog.action = tradeResult.action;
      tradeLog.balances = tradeResult.balances;
    }

    this.tl.addTradeLog(tradeLog);

    if (trigger) {
      console.log(tradeLog);
    }
    console.log({t: tradeLog.t, enableTrading});
  }
};

module.exports = stratDetectRevesal;
