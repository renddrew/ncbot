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

  getLastBB(retrieveTime) {

    // prepare arrays of last time frames
    const maSize = 20;
    const times1min = [];
    const times5min = [];
    const times15min = [];

    const start5minTime = parseInt(moment(retrieveTime).format('mm')) - (parseInt(moment(retrieveTime).format('mm')) % 5);
    const start5minEpoch = moment(retrieveTime).minute(start5minTime).format('x');
    const start15minTime = parseInt(moment(retrieveTime).format('mm')) - (parseInt(moment(retrieveTime).format('mm')) % 15);
    const start15minEpoch = moment(retrieveTime).minute(start15minTime).format('x');

    for (let i = 0; i < maSize; i++) {
      const time1min = parseInt(moment(retrieveTime).subtract(i, 'minute').format('x'));
      const time5min = parseInt(moment(start5minEpoch - (i*(1000*60*5))).format('x'));
      const time15min = parseInt(moment(start15minEpoch - (i*(1000*60*15))).format('x'));
      times1min.push(time1min);
      times5min.push(time5min);
      times15min.push(time15min);
    }

    const min1 = this.calcMaBB(times1min);
    const min5 = this.calcMaBB(times5min);
    const min15 = this.calcMaBB(times15min);


    console.log(min1)
    console.log(min5)
    console.log(min15)

  }

  
  calcMaBB(timeList) {
    // timeList is list of times
    const itms = [];
    const maitms = [];
    let priceTotal = 0;
    for (let i = 0; i < timeList.length; i++) {
      const p = this.allPeriodHist.find(itm => {
        const minTime = itm.t - (1000*3);
        const maxTime = itm.t + (1000*3);
        return timeList[i] >= minTime && timeList[i] <= maxTime;
      });
      if (p && p.p) {
        p.nt = moment(p.t).format('llll');
        itms.push(p);
        priceTotal += parseInt(p.p);
        maitms.push(p.p);
      }
    }

    const ma = priceTotal / itms.length;
    const stdDev = utils.calcStdDeviation(maitms);
    return {
      ma,
      bbUpper: ma + (2 * stdDev),
      bbLower: ma - (2 * stdDev),
    };
  }



}

module.exports = GetRanges;





