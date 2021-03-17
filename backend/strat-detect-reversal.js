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
    //this.tl = new TradeLog();
  }

  async detectReversal (lastPrice, timeFrameMins, multiplier) {
    this.tl = new TradeLog();
    timeFrameMins = timeFrameMins || 1;
    multiplier = multiplier || 0.5;
    const bbMultiplier = 0.7;
    const histHours = 2;
    this.ranges = new GetRanges(histHours);
    const { tradeLog } = this.tl;
    tradeLog.strategy = `Detect Reversal ${timeFrameMins} timeframe`;
    tradeLog.ts = (new Date()).getTime();
    
    /*
      - remember the highest or lowest price in the last 2x timeframe unit
      - if the current price gets X percentage above or below, call reversal
      - X percentage could be weighted by volatility. 
      - could weight X percentage also by gain since last trade
    */

    // get the high - search through the last results from 3x timeframe mins
    // build the weighted percentage
    // compare the current price to the high

    const hist = this.ranges.allPeriodHist;
    const pastMins = 3;
    const rangeHistTime = (new Date()).getTime() - (1000 * 60 * timeFrameMins * pastMins);
    let rangeHigh = 0;
    let rangeLow = 0;
    let histRange = [];

    // calculate the standard deviation
    const timeList = this.ranges.getTimeList(timeFrameMins, 20);
    const ma20 = this.ranges.getMa(timeList);
    const stdDev = utils.calcStdDeviation(ma20.list);
    const reversalWeight = stdDev * multiplier;
    const bb = this.ranges.calcBB(timeList, bbMultiplier);
    const bbUpper = bb.bbUpper;
    const bbLower = bb.bbLower;
    const lastPriceClose = bb.p;
    tradeLog.indicators = bb;
    tradeLog.p = lastPrice
    tradeLog.t = bb.t;

    // build percentage

    // compare the current price to the high and low (of past timeframe history)
    
    // if the price is X different detect reversal

    // X different is calculated from a percentage of the price 

    // current price minus highest price > standard deviation

    for (let i = 0; i < hist.length; i++) {
      if (hist[i].t < rangeHistTime) continue;

      if (hist[i].p > rangeHigh) {
        rangeHigh = hist[i].p;
      }
      if (!rangeLow || hist[i].p < rangeLow) {
        rangeLow = hist[i].p;
      }
      histRange.push(hist[i]);
    }

    let reversalDir = 'none';

    // price is going down
    // 10 - 8 = 2 > 2
    const lastPriceHighDiff = (rangeHigh - lastPrice);
    if (lastPriceHighDiff > reversalWeight) {
      reversalDir = 'down';
    }

    // price is going up 
    // 10 - 8 = 2
    const lastPriceLowDiff = (lastPrice - rangeLow);
    if (lastPriceLowDiff > reversalWeight) {
      reversalDir = 'up';
    }

    let trigger = ''
    if (lastPrice < lastPriceClose && lastPrice > ma20.value && reversalDir === 'down') {
      // SELL if price going down from last close, and lastprice is above ma20 and is downward reversal
      trigger = 'sell'
    } else if (lastPrice > lastPriceClose && lastPrice < ma20.value && reversalDir === 'up') {
      // BUY if price is going up from last close, and lastPrice is less then ma20 and is upward reversal 
      trigger = 'buy'
    }

    let enableTrading = '';
    if (trigger) {
      const th = new TradeHelpers();
      const tradeResult = await th.tryTrade(trigger)
      tradeLog.trigger = trigger;
      tradeLog.action = tradeResult.action;
      tradeLog.balances = tradeResult.balances;
      enableTrading = tradeResult.enableTrading;
    }

    const out = {
      reversalDir,
      reversalWeight,
      lastPriceHighDiff,
      lastPriceLowDiff,
    };

    tradeLog.out = out;

    this.tl.addTradeLog(tradeLog);

    if (trigger) {
      console.log(tradeLog);
    }
    console.log({t: tradeLog.t, enableTrading});
    // console.log(out)
  }
};

module.exports = stratDetectRevesal;
