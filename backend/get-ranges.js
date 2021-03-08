const StormDB = require('stormdb');
const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs');
const utils = require('./utils');

moment.tz.setDefault("Africa/Abidjan"); // set UTC 0

// https://www.npmjs.com/package/stormdb

const GetRanges = class {
  
  constructor() {
    this.timeNow = parseInt((new Date()).getTime());
    this.shortPeriod = this.timeNow - (60*30*1000);    // 30mins
    this.mediumPeriod = this.timeNow - (60*60*1000*1.5); // 1.5hrs
    this.longPeriod = this.timeNow - (60*60*1000*3);   // 3hrs
    this.getPeriodHistory();
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
      // temp for bad values from poor defaults, will keep first condition
      if (!this.allPeriodHist[ti].p || this.allPeriodHist[ti].p === 999999999 || this.allPeriodHist[ti].p === '22') continue;


      // problem becuase this calculates MA for every second, need to divide time or mulitply ma size eg for  MA20 do 20*60 assuming there are 60 hist items per min

      // solution A: keep track of timestamp and do not record another in maSize until x timeframe has passed eg. 1 min, 5min time frames

      // https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/bollinger-bands

      // https://www.investopedia.com/terms/s/standarddeviation.asp

      

      let maSize = 20 * 60; // assume 60 entries in second
      let ma20 = 0;
      const maList = [];
      if (ti > maSize) {
        for (let ma20i = 0; ma20i < maSize; ma20i++) {
          // add last 20 prices together
          const val = parseInt(this.allPeriodHist[ti - ma20i].p);
          ma20+=val;
          maList.push(val);
        }
        ma20 /= maSize;
        this.allPeriodHist[ti].ma20 = ma20;
        
        // add bollinger band
        if (ti > maSize*2) {
          const stdDev = utils.calcStdDeviation(maList);
          this.allPeriodHist[ti].stdDev = stdDev;
          this.allPeriodHist[ti].bbUpper = ma20 + (2 * stdDev);
          this.allPeriodHist[ti].bbLower = ma20 - (2 * stdDev);
        }
      }
 
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

    const shortPeriodStartEnd = utils.getPeriodStartEndAverages(this.shortPeriodHist, 0.2); // 20 percent
    const mediumPeriodStartEnd = utils.getPeriodStartEndAverages(this.mediumPeriodHist, 0.2);
    const longPeriodStartEnd = utils.getPeriodStartEndAverages(this.longPeriodHist, 0.2);

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

    data.longUptrend = longPeriodStartEnd.start < longPeriodStartEnd.end;        // short and medium trend averages are greater than long trend
    data.mediumUptrend = mediumPeriodStartEnd.start < mediumPeriodStartEnd.end;  // medium average is greater than long average
    data.shortUptrend = shortPeriodStartEnd.start < shortPeriodStartEnd.end;     // short average is greater than medium average

    return data;
  }

  getLastBB() {

    // make sure newest first
    const itms = this.allPeriodHist.sort((a, b) => {
      return b.t - a.t;
    });
  /*
      record ma for different time frames
      - before using next item, make sure it's time is X seconds past last used item's time

    */

    let last1Min = 0;
    let last5min = 0;
    let last15min = 0;

    // loop last items first
    let timeFrames5min = [];
    let ma5min = 0;
    let last5minTime = 0;
    const maLength = 20;
    let count = 0;

    // assemble arrays of ma values for each time period
    // unsolved problem with this is that if there are missing entries the MA will get thrown off
    for (let i = 0; i < itms.length; i++) {
      if (!itms[i]) continue;
      const timeNow = parseInt(itms[i].t);
      const nextCaptureTime = last5minTime - (1000*60*5);

      if (!last5minTime || (timeNow < nextCaptureTime)) {

        const missed5minEntries = parseInt((last5minTime - timeNow) / ((1000*60*5) + (1000*10)));
        if (missed5minEntries >= 1) {
          count += missed5minEntries;
        }

        count++;

        last5minTime = timeNow;

        itms[i].nt = moment(itms[i].t).format('llll');
        timeFrames5min.push(itms[i]);
        ma5min += parseInt(itms[i].p);

        timeFrames5min[i]

      }
      if (count >= maLength) break;
    }
    
    ma5min /= timeFrames5min.length;

    const ls = timeFrames5min.sort((a, b) => {
      return b.t - a.t;
    });

    console.log(ma5min);
    console.log(timeFrames5min.length)
    console.log(ls);




    
  }






}

module.exports = GetRanges;



