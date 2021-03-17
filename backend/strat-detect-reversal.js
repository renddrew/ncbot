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
      - remember the highest or lowest price in the last 2x timeframe unit
      - if the current price gets X percentage above or below, call reversal
      - X percentage could be weighted by volatility. 
      - could weight X percentage also by gain since last trade
    */


    // get default tradelog object to assign to
    const { tradeLog } = this.tl;
    tradeLog.strategy = `Detect Reversal ${timeFrameMins} timeframe`;
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





    tradeLog.triggerDetails = 'someting';
    // set trigger

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
