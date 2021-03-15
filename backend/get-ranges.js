const StormDB = require('stormdb');
const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs');
const utils = require('./utils');
const { _ } = require('core-js');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

moment.tz.setDefault("Africa/Abidjan"); // set UTC 0

const GetRanges = class {
  
  constructor() {
    this.timeNow = parseInt((new Date()).getTime());
    this.shortPeriod = this.timeNow - (60*30*1000);    // 30mins
    this.mediumPeriod = this.timeNow - (60*60*1000*1.5); // 1.5hrs
    this.longPeriod = this.timeNow - (60*60*1000*3);   // 3hrs
    this.periodHistory = {};
    this.getPeriodHistory();
  }

  getPeriodHistory() {
    const dirpath = './backend/db/btcusdt';
    const histHours = 6;

    this.allPeriodHist = [];
    this.shortPeriodHist = [];
    this.mediumPeriodHist = [];
    this.longPeriodHist = [];

    const currentHour = parseInt(moment().format('H'));
    let dateFile = '';

    this.allPeriodHist = [];
    for (let i = 0; i < histHours; i++) {
      let hourCalc = currentHour - i;

      if (hourCalc < 0) {
        dateFile = moment().subtract(1, 'day').hour(24+hourCalc).format('YYYY-MM-DD-H');
      } else {
        dateFile = moment().hour(hourCalc).format('YYYY-MM-DD-H');
      }

      const adapter = new FileSync(`${dirpath}/${dateFile}.json`);
      const db = low(adapter);
      
      let vals = db.get('history').value();
      // console.log({
      //   dateFile,
      //   vals: vals && vals.length ? vals.length : 0
      // })
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
    this.periodHistory = data;
    return data;
  }

  getTimeList(timeFrameMins, periodLength, retrieveTime) {
    retrieveTime = retrieveTime || {};
    const timeList = [];

    const startTime = parseInt(moment(retrieveTime).format('mm')) - (parseInt(moment(retrieveTime).format('mm')) % timeFrameMins);
    const startEpoch = moment(retrieveTime).minute(startTime).format('x');

    for (let i = 0; i < periodLength; i++) {
      const addTime = parseInt(moment(startEpoch - (i*(1000*60*timeFrameMins))).startOf('minute').format('x'));
      timeList.push(addTime);
    }
    return timeList;
  }

  getMa(timeList) {
    const prices = [];
    const maList = [];
    let priceTotal = 0;
    for (let i = 0; i < timeList.length; i++) {
      const p = this.allPeriodHist.find(itm => {
        const minTime = itm.t - (1000*0.2);
        const maxTime = itm.t + (1000*0.2);
        return timeList[i] >= minTime && timeList[i] <= maxTime;
      });
      if (p && parseFloat(p.p) > 0) {
        p.nt = moment(p.t).format('llll');
        prices.push(p);
        priceTotal += parseFloat(p.p);
        maList.push(p.p);
      }
    }
    const ma = utils.formatNum(priceTotal / prices.length, 2);
    return { value: ma, list: maList, prices };
  }

  calcBB(timeList, multiplier, multiplierLower) {
    const maList = this.getMa(timeList);
    const stdDev = utils.calcStdDeviation(maList.list);
    const ma = maList.value
    multiplierLower = multiplierLower !== null ? multiplierLower : multiplier;

    return {
      p: maList.prices[0] ? maList.prices[0].p : null,
      t: moment(timeList[0]).tz('America/Toronto').format('h:mm:ss SSS'),
      ma,
      stdDev,
      maLen: maList.list.length,
      bbUpper: ma + (multiplier * stdDev),
      bbLower: ma - (multiplierLower * stdDev),
      stdDevMultiUpper: multiplier,
      stdDevMultiLower: multiplierLower,
    };
  }

  // https://nullbeans.com/how-to-calculate-the-relative-strength-index-rsi/

}

module.exports = GetRanges;





