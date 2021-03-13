const StormDB = require('stormdb');
const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs');
const utils = require('./utils');

moment.tz.setDefault("Africa/Abidjan"); // set UTC 0

// https://www.npmjs.com/package/stormdb

const SavePriceHistory = class {
  constructor(lastPrice) {
    this.lastPrice = lastPrice;
    this.savePrice();
  }

  // should move database class inst to be global shared, could be causing data loss somehow
  savePrice() {
    const dateFile = moment().format('YYYY-MM-DD-H');
    const dirpath = './backend/db/btcusdt';
    fs.mkdirSync(dirpath, { recursive: true });
    const dateFileStr = `${dirpath}/${dateFile}.stormdb`;
    const dbEngine = new StormDB.localFileEngine(dateFileStr, {
      async: false,
    });
    const currentDb = new StormDB(dbEngine);
    const time = (new Date()).getTime();
    if (!this.lastPrice) return;
    currentDb.get('history').push({ t: time, p: this.lastPrice });
    currentDb.save(); // async
  }
};

module.exports = SavePriceHistory;