const StormDB = require('stormdb');
const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs');
const utils = require('./utils');
const { timeStamp } = require('console');
const GetRanges = require('./get-ranges');
const binanceRequests = require('./binance-requests');

moment.tz.setDefault("Africa/Abidjan"); // set UTC 0


const stratBBreEntry = class {

  constructor() {
    cron.schedule('*/5 * * * * *', async () => {
      const res = await this.detectEntryMinute();
      console.log(res)
    });
  }

  async detectEntryMinute() {
    let doBuy = false;
    let doSell = false;
    let out = {};

    this.ranges = new GetRanges();
    const bbMuliplier = 1;
    const timeFrameBasisKey = 'min1';

    const closeVals = this.ranges.getLastBB(moment().startOf('minute'), bbMuliplier);
    const prevCloseMin = moment().startOf('minute').subtract(1, 'minute');
    const prevCloseVals = this.ranges.getLastBB(prevCloseMin, bbMuliplier);

    const closeUpperBB = closeVals[timeFrameBasisKey].bbUpper;
    const closeLowerBB = closeVals[timeFrameBasisKey].bbLower;
    const prevCloseUpperBB = prevCloseVals[timeFrameBasisKey].bbUpper;
    const prevCloseLowerBB = prevCloseVals[timeFrameBasisKey].bbLower;

    // open price is price of minute observed
    // close price is close second price
    const openPrice = closeVals.min1.p;
    const prevClosePrice = prevCloseVals.min1.p;

    // upper re-entry condition
    let upperReEntry = false;
    if (openPrice < closeUpperBB && prevClosePrice > prevCloseUpperBB) {
      upperReEntry = true;
    }

    let lowerReEntry = false;
    if (openPrice > closeLowerBB && prevClosePrice < prevCloseLowerBB) {
      lowerReEntry = true;
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

    let enableTrading = false;

    if (lowerReEntry) {
      out.lowerReEntry = lowerReEntry;
      doBuy = true;
    } else if (upperReEntry) {
      out.upperReEntry = upperReEntry;
      doSell = true;
    }

    if (doBuy || doSell) {
      const balances = await binanceRequests.getBalances();
      const balanceBTC = balances && balances.BTC.available ? parseFloat(balances.BTC.available) : 0;
      const balanceUSDT = balances && balances.USDT.available ? parseFloat(balances.USDT.available) : 0;
      out.balanceBTC = balanceBTC;
      out.balanceUSDT = balanceUSDT;
      if (doBuy) {
        if (enableTrading && balanceUSDT > 11) {
          const buyRes = await binanceRequests.marketBuy();
          out.action = buyRes;
        }
        out.trigger = 'BUY';
      } else {
        if (enableTrading && balanceBTC > 0.0002) {
          const sellRes = await binanceRequests.marketSell();
          out.action = sellRes;
        }
        out.trigger = 'SELL';
      }
    }

    out.time = closeVals.min1.time;

    if (closeVals[timeFrameBasisKey].maLength < 18) {
      out.close = closeVals[timeFrameBasisKey];
    }

    if (!closeUpperBB) {
      out.close = closeVals[timeFrameBasisKey];
    }
    if (!prevCloseLowerBB) {
      out.prevClose = prevCloseVals[timeFrameBasisKey];
    }

    if (upperReEntry || lowerReEntry) {
      out.closeVals = closeVals[timeFrameBasisKey];
      out.prevCloseVals = prevCloseVals[timeFrameBasisKey];
    }

    return out;

  }

};

module.exports = stratBBreEntry;
