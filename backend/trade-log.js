const StormDB = require('stormdb');
const fs = require('fs');
const moment = require('moment-timezone');
moment.tz.setDefault("Africa/Abidjan"); // set UTC 0

// https://www.npmjs.com/package/stormdb

const TradeLog = class {
  constructor() {
    this.dateFile = moment().format('YYYY-MM-DD');
    this.dirpath = './backend/db/tradeLog/btcusdt';
    fs.mkdirSync(this.dirpath, { recursive: true });
    this.dateFileStr = `${this.dirpath}/${this.dateFile}.stormdb`;
    const engine = new StormDB.localFileEngine(this.dateFileStr, { async: true });
    this.db = new StormDB(engine);
    this.db.default({ log: [] });

    this.tradeLog = {
      action: '',
      trigger: '',
      triggerDetails: '',
      strategy: '',
      p: 0,
      t: 0,
      ts: 0,
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

  getLogs(params) {
    let { dateFile } = this;
    let db = null;
    if (params && params.date) {
      dateFile = moment(params.date).format('YYYY-MM-DD');
      const dateFileStr = `${this.dirpath}/${dateFile}.stormdb`;
      const engine = new StormDB.localFileEngine(dateFileStr, { async: true });
      db = new StormDB(engine);
    } else {
      // use current db
      db = this.db;
    }

    let data = db.get('log');

    if (params && params.filterTrades) {
      data.filter((itm) => {
        return itm.action;
      });
    }

    data.sort((a, b) => {
      return a.ts - b.ts;
    });

    return data.value();
  }
};

module.exports = TradeLog;
