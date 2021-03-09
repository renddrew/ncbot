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
    this.ranges = new GetRanges();
  }

  detectEntryMinute(currentPrice) {
    const bbMuliplier = 1;
    const currentVals = this.ranges.getLastBB({}, bbMuliplier);
    const lastMin = moment().subtract(1, 'minute');
    const lastVals = this.ranges.getLastBB(lastMin, bbMuliplier);

    const currentUpperBB = currentVals.min1.bbUpper;
    const currentLowerBB = currentVals.min1.bbLower;
    const lastUpperBB = lastVals.min1.bbUpper;
    const lastLowerBB = lastVals.min1.bbLower;

    // upper re-entry condition
    let upperReEntry = false;
    if (currentPrice < currentUpperBB && currentPrice > lastUpperBB) {
      upperReEntry = true;
    }

    let lowerReEntry = false;
    if (currentPrice > currentLowerBB && currentPrice < lastLowerBB) {
      lowerReEntry = true;
    }

    const out = {
      upperReEntry,
      lowerReEntry,
    };

    if (upperReEntry || lowerReEntry) {
      out.currentVals = currentVals;
      out.lastVals = lastVals;
    }

    return out;
  }
};

module.exports = stratBBreEntry;