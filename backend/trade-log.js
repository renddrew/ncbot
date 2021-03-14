const StormDB = require('stormdb');
const fs = require('fs');
const moment = require('moment-timezone');
moment.tz.setDefault("Africa/Abidjan"); // set UTC 0

// https://www.npmjs.com/package/stormdb

const TradeLog = class {
  constructor() {
    const dateFile = moment().format('YYYY-MM-DD');
    const dirpath = './backend/db/tradeLog/btcusdt';
    fs.mkdirSync(dirpath, { recursive: true });
    const dateFileStr = `${dirpath}/${dateFile}.stormdb`;
    const engine = new StormDB.localFileEngine(dateFileStr, { async: true });
    this.db = new StormDB(engine);
    this.db.default({ log: [] });

    this.tradeLog = {
      action: '',
      trigger: '',
      triggerDetails: '',
      strategy: '',
      p: 0,
      t: 0,
      balances: {
        btc: 0,
        usdt: 0,
      },
      indicators: {
        min1: {
          t: 0,
          ma20: 0,
          maLen: 0,
          stdDevMultiUpper: 0,
          stdDevMultiLower: 0,
          bbUpper: 0,
          bbLower: 0,
          stdDev: 0,
        },
        min5: {
          t: 0,
          ma20: 0,
          maLen: 0,
          stdDevMultiUpper: 0,
          stdDevMultiLower: 0,
          bbUpper: 0,
          bbLower: 0,
          stdDev: 0,
        },
        min15: {
          t: 0,
          ma20: 0,
          maLen: 0,
          stdDevMultiUpper: 0,
          stdDevMultiLower: 0,
          bbUpper: 0,
          bbLower: 0,
          stdDev: 0,
        },
      },
    };
  }

  addTradeLog(entry) {
    return new Promise((resolve, reject) => {
      this.db.get('log').push(entry).save().then(() => {
        resolve('success');
      }).catch((err) => {
        reject(err);
      });
    });
  }

  getLogs(tStart, tEnd) {
    
  }
};

module.exports = TradeLog;
