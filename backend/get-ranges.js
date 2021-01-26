const StormDB = require('stormdb');
const cron = require('node-cron');
const moment = require('moment');
const fs = require('fs');
const utils = require('./utils');

// https://www.npmjs.com/package/stormdb

const GetRanges = class {
  
  constructor() {
    this.timeNow = parseInt((new Date()).getTime());
    this.shortPeriod = this.timeNow - (60*60*1000);    // 1hr
    this.mediumPeriod = this.timeNow - (60*60*1000*2); // 2hrs
    this.longPeriod = this.timeNow - (60*60*1000*4);   // 4hrs
    this.allPeriodHist = [];
    this.shortPeriodHist = [];
    this.mediumPeriodHist = [];
    this.longPeriodHist = [];
    this.getPeriodHistory();
  }

  getPeriodHistory() {
    const dateFile = moment().format('YYYY-MM-DD');
    const currentHour = parseInt(moment().format('H'));
    const dateFileDir = './backend/db/btcusdt';
    const histHours = 4;

    this.allPeriodHist = [];
    for (let i = 0; i < histHours; i++) {
      let hourCalc = currentHour - i;
      let db = `${dateFileDir}/${dateFile}-${hourCalc}.stormdb`;
      let engine = new StormDB.localFileEngine(db);
      let vals = (new StormDB(engine)).get('history').value();
      if (!vals || !vals.length) continue;
      this.allPeriodHist = this.allPeriodHist.concat(vals);
    }

    const data = {
      allPeriodHist: this.allPeriodHist.length,
    };
    data.shortMaxPrice = 0;
    data.shortMinPrice = 999999999;
    data.mediumMaxPrice = 0;
    data.mediumMinPrice = 9999999999;
    data.longMaxPrice = 0;
    data.longMinPrice = 99999999999;

    for (let ti = 0; ti < this.allPeriodHist.length; ti++) {
      if (this.allPeriodHist[ti].t > this.shortPeriod) {
        this.shortPeriodHist.push(this.allPeriodHist[ti]);
        if (data.shortMaxPrice < this.allPeriodHist[ti].p) {
          data.shortMaxPrice = this.allPeriodHist[ti].p;
        }
        if (data.shortMinPrice > this.allPeriodHist[ti].p) {
          data.shortMinPrice = this.allPeriodHist[ti].p;
        }
      }
      if (this.allPeriodHist[ti].t > this.mediumPeriod) {
        this.mediumPeriodHist.push(this.allPeriodHist[ti]);
        if (data.mediumMaxPrice < this.allPeriodHist[ti].p) {
          data.mediumMaxPrice = this.allPeriodHist[ti].p;
        }
        if (data.mediumMinPrice > this.allPeriodHist[ti].p) {
          data.mediumMinPrice = this.allPeriodHist[ti].p;
        }
      }
      if (this.allPeriodHist[ti].t > this.longPeriod) {
        this.longPeriodHist.push(this.allPeriodHist[ti]);
        if (data.longMaxPrice < this.allPeriodHist[ti].p) {
          data.longMaxPrice = this.allPeriodHist[ti].p;
        }
        if (data.longMinPrice > this.allPeriodHist[ti].p) {
          data.longMinPrice = this.allPeriodHist[ti].p;
        }
      }
    }

    return data;
  }

}

module.exports = GetRanges;
