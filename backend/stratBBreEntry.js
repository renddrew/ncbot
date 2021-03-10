const StormDB = require('stormdb');
const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs');
const utils = require('./utils');
const { timeStamp } = require('console');
const GetRanges = require('./get-ranges');

moment.tz.setDefault("Africa/Abidjan"); // set UTC 0


const stratBBreEntry = class {

  constructor() {
    cron.schedule('*/5 * * * * *', () => {
      const res = this.detectEntryMinute();
      console.log(res)
    });
  }

  detectEntryMinute() {
    this.ranges = new GetRanges();
    const bbMuliplier = 1;
    const closeVals = this.ranges.getLastBB(moment().startOf('minute'), bbMuliplier);
    const prevCloseMin = moment().subtract(1, 'minute').startOf('minute');
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

    const out = {
      time: closeVals.min1.time,
      upperReEntry,
      lowerReEntry,
      prevClosePrice,
      prevCloseUpperBB: closeVals.min1.bbUpper,
      prevCloseLowerBB: closeVals.min1.bbLower,
      // prevClose: prevCloseVals.min1
    };

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
      out.closeVals = closeVals;
      out.prevCloseVals = prevCloseVals;
    }

    return out;

  }

};

module.exports = stratBBreEntry;
