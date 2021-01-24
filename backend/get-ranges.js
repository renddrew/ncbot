const StormDB = require('stormdb');
const cron = require('node-cron');
const moment = require('moment');
const fs = require('fs');
const utils = require('./utils');

// https://www.npmjs.com/package/stormdb

const GetRanges = class {

  constructor() {
    let timeNow = parseInt((new Date()).getTime());
    let shortPeriod = timeNow - (60*1000);
    let mediumPeriod = timeNow - (60*2*1000);
    let longPeriod = timeNow - (60*4*1000);
    let allPeriodHist = [];
    let shortPeriodHist = [];
    let mediumPeriodHist = [];
    let longPeriodHist = [];
    this.getPeriodHistory();
  }

  getPeriodHistory(){
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

    let shortMaxPrice = 0;
    let shortMinPrice = 0;
    let mediumMaxPrice = 0;
    let mediumMinPrice = 0;
    let longMaxPrice = 0;
    let longMinPrice = 0;
    for (let ti = 0; ti < this.allPeriodHist.length; ti++) {
      if (this.allPeriodHist[ti].t > this.shortPeriod ) {
        this.shortPeriodHist.push(allPeriodHist[ti]);
        // check and update in and max prices

      }
    }

  }

}

module.exports = GetRanges;
