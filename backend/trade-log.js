const StormDB = require('stormdb');
const moment = require('moment-timezone');
moment.tz.setDefault("Africa/Abidjan"); // set UTC 0

// https://www.npmjs.com/package/stormdb

const TradeLog = class {
  constructor() {
    const dbLocation = './backend/db/trade-log.stormdb';
    let engine = new StormDB.localFileEngine(dbLocation, { async: true });
    this.db = new StormDB(engine);
    this.db.default({ settings: {} });

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

  } 

  getSettings(key) {
    key = key || 'settings';
    return this.db.get(key).value();
  }

  saveSettings(obj) {
    return new Promise((resolve) => {
      const settings = this.getSettings();
      Object.keys(obj).forEach((key) => {
        settings[key] = obj[key];
      });
      this.db.set('settings', settings).save().then(() => {
        resolve('success');
      });
    });
  }
};

module.exports = TradeLog;
