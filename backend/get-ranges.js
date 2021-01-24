const StormDB = require('stormdb');
const cron = require('node-cron');
const moment = require('moment');
const fs = require('fs');
const utils = require('./utils');

// https://www.npmjs.com/package/stormdb

const GetRanges = class {

  constructor() {
    let timeNow = new Date().getTime();
    let short = 60*1000;
    let medium = 60*2*1000;
    let long = 60*4*1000;
    let allPeriodHist = [];
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
  }

}

module.exports = GetRanges;
