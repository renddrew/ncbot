const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const fs = require('fs');
const moment = require('moment-timezone');
moment.tz.setDefault("Africa/Abidjan"); // set UTC 0

// https://www.npmjs.com/package/lowdb

const TradeLog = class {
  constructor() {
    this.dateFile = moment().format('YYYY-MM-DD');
    this.dirpath = './backend/db/tradeLog/btcusdt';
    this.dateFileStr = `${this.dirpath}/${this.dateFile}.json`;
    const adapter = new FileSync(this.dateFileStr);
    this.db = low(adapter);
    this.db.defaults({ log: [] }).write();

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
      this.db.get('log').push(entry).write();
      resolve('success');
    });
  }

  getLogs(params) {
    return new Promise((resolve, reject) => {
      let { dateFile } = this;
      let db = null;
      if (params && params.date) {
        dateFile = moment(params.date).format('YYYY-MM-DD');
        const dateFileStr = `${this.dirpath}/${dateFile}.json`;
        const adapter = new FileSync(dateFileStr);
        db = low(adapter);
      } else {
        // use current db
        db = this.db;
      }

      let data = db.get('log');

      if (params && params.filterTrades) {
        data.filter((itm) => {
          return itm.trigger;
        });
      }

      data.filter((itm) => {
        return itm.ts;
      });

      data.sort((a, b) => {
        return b.ts - a.ts;
      });

      resolve(data.value());
    });
  }
};

module.exports = TradeLog;
