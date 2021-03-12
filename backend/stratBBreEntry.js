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
    cron.schedule('2 * * * * *', async () => {
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
    const closeVals = this.ranges.getLastBB(moment().startOf('minute'), bbMuliplier);
    const prevCloseMin = moment().startOf('minute').subtract(1, 'minute');
    const prevCloseVals = this.ranges.getLastBB(prevCloseMin, bbMuliplier);

    const closeUpperBB = closeVals.min1.bbUpper;
    const closeLowerBB = closeVals.min1.bbLower;
    const prevCloseUpperBB = prevCloseVals.min1.bbUpper;
    const prevCloseLowerBB = prevCloseVals.min1.bbLower;

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
      if (doBuy && balanceUSDT > 11) {
        const buyRes = await binanceRequests.marketBuy();
        out.buyRes = buyRes;
        out.action = 'BUY';
      } else if (doSell && balanceBTC > 0.0002) {
        const sellRes = await binanceRequests.marketSell();
        out.sellRes = sellRes;
        out.action = 'SELL';
      } else {
        out.action = 'NONE';
      }
    }

    out.time = closeVals.min1.time;

    if (closeVals.min1.maLength < 18) {
      out.close = closeVals.min1;
    }

    if (!closeUpperBB) {
      out.close = closeVals.min1;
    }
    if (!prevCloseLowerBB) {
      out.prevClose = prevCloseVals.min1;
    }

    if (upperReEntry || lowerReEntry) {
      out.closeVals = closeVals.min1;
      out.prevCloseVals = prevCloseVals.min1;
    }

    return out;

  }

};

module.exports = stratBBreEntry;
