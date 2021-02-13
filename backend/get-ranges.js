const StormDB = require('stormdb');
const cron = require('node-cron');
const moment = require('moment');
const fs = require('fs');
const utils = require('./utils');

// https://www.npmjs.com/package/stormdb

const GetRanges = class {
  
  constructor() {
    this.timeNow = parseInt((new Date()).getTime());
    this.shortPeriod = this.timeNow - (60*30*1000);    // 30mins
    this.mediumPeriod = this.timeNow - (60*60*1000*1.5); // 1.5hrs
    this.longPeriod = this.timeNow - (60*60*1000*3);   // 3hrs
    this.getPeriodHistory();
  }

  getPeriodStartEndAverages(periodHist, percentStartEnd) {
    const setSize = parseInt(periodHist.length * percentStartEnd);
    let startTotal = 0;
    let endTotal = 0;
    for (let i = 0; i < periodHist.length; i++) {
      if (i < setSize) {
        startTotal += periodHist[i].p;
      }
      if (i >= (periodHist.length - setSize)) {
        endTotal += periodHist[i].p;
      }
    }
    return {
      start: startTotal / setSize,
      end: endTotal / setSize
    };
  }

  getPeriodHistory() {
    const dateFile = moment().format('YYYY-MM-DD');
    const currentHour = parseInt(moment().format('H'));
    const dateFileDir = './backend/db/btcusdt';
    const histHours = 4;

    this.allPeriodHist = [];
    this.shortPeriodHist = [];
    this.mediumPeriodHist = [];
    this.longPeriodHist = [];

    this.allPeriodHist = [];
    for (let i = 0; i < histHours; i++) {
      let hourCalc = currentHour - i;
      let db = `${dateFileDir}/${dateFile}-${hourCalc}.stormdb`;
      let engine = new StormDB.localFileEngine(db);
      let vals = (new StormDB(engine)).get('history').value();
      if (!vals || !vals.length) continue;
      this.allPeriodHist = this.allPeriodHist.concat(vals);
    }

    // ensure oldest last
    this.allPeriodHist = this.allPeriodHist.sort((a, b) => {
      return a.t - b.t;
    });

    const data = {
      allPeriodHist: this.allPeriodHist.length,
    };
    
    data.shortMaxPrice = 0;
    data.shortMinPrice = 999999999;
    data.mediumMaxPrice = 0;
    data.mediumMinPrice = 9999999999;
    data.longMaxPrice = 0;
    data.longMinPrice = 99999999999;
    data.shortAveragePrice = 0;
    data.mediumAveragePrice = 0;
    data.longAveragePrice = 0;

    for (let ti = 0; ti < this.allPeriodHist.length; ti++) {
      if (this.allPeriodHist[ti].t > this.shortPeriod) {
        data.shortAveragePrice += this.allPeriodHist[ti].p;
        this.shortPeriodHist.push(this.allPeriodHist[ti]);
        if (data.shortMaxPrice < this.allPeriodHist[ti].p) {
          data.shortMaxPrice = this.allPeriodHist[ti].p;
        }
        if (data.shortMinPrice > this.allPeriodHist[ti].p) {
          data.shortMinPrice = this.allPeriodHist[ti].p;
        }
      }
      if (this.allPeriodHist[ti].t > this.mediumPeriod) {
        data.mediumAveragePrice += this.allPeriodHist[ti].p;
        this.mediumPeriodHist.push(this.allPeriodHist[ti]);
        if (data.mediumMaxPrice < this.allPeriodHist[ti].p) {
          data.mediumMaxPrice = this.allPeriodHist[ti].p;
        }
        if (data.mediumMinPrice > this.allPeriodHist[ti].p) {
          data.mediumMinPrice = this.allPeriodHist[ti].p;
        }
      }
      if (this.allPeriodHist[ti].t > this.longPeriod) {
        data.longAveragePrice += this.allPeriodHist[ti].p;
        this.longPeriodHist.push(this.allPeriodHist[ti]);
        if (data.longMaxPrice < this.allPeriodHist[ti].p) {
          data.longMaxPrice = this.allPeriodHist[ti].p;
        }
        if (data.longMinPrice > this.allPeriodHist[ti].p) {
          data.longMinPrice = this.allPeriodHist[ti].p;
        }
      }
    }

    const shortPeriodStartEnd = this.getPeriodStartEndAverages(this.shortPeriodHist, 0.2); // 20 percent
    const mediumPeriodStartEnd = this.getPeriodStartEndAverages(this.mediumPeriodHist, 0.2);
    const longPeriodStartEnd = this.getPeriodStartEndAverages(this.longPeriodHist, 0.2);

    data.shortSetStartAverage = shortPeriodStartEnd.start;
    data.shortSetEndAverage = shortPeriodStartEnd.end;

    data.mediumSetStartAverage = mediumPeriodStartEnd.start;
    data.mediumSetEndAverage = mediumPeriodStartEnd.end;

    data.longSetStartAverage = longPeriodStartEnd.start;
    data.longSetEndAverage = longPeriodStartEnd.end;

    // calculate period average prices
    data.shortAveragePrice /= this.shortPeriodHist.length;
    data.mediumAveragePrice /= this.mediumPeriodHist.length;
    data.longAveragePrice /= this.longPeriodHist.length;

    data.longUptrend = longPeriodStartEnd.start < longPeriodStartEnd.end; // short and medium trend averages are greater than long trend
    data.mediumUptrend = mediumPeriodStartEnd.start < mediumPeriodStartEnd.end; // medium average is greater than long average
    data.shortUptrend = shortPeriodStartEnd.start < shortPeriodStartEnd.end; // short average is greater than medium average

    return data;
  }
}

module.exports = GetRanges;
