const StormDB = require('stormdb');
const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs');
const utils = require('./utils');

moment.tz.setDefault("Africa/Abidjan"); // set UTC 0

// https://www.npmjs.com/package/stormdb

const SavePriceHistory = class {

  constructor() {
    let priceHistDb = null;

    this.setDateFile();

    cron.schedule('* * * * *', () => {
      this.setDateFile();
    });
  }

  setDateFile() {
    const dateFile = moment().format('YYYY-MM-DD-H');
    const dirpath = './backend/db/btcusdt';
    fs.mkdirSync(dirpath, { recursive: true });
    const dateFileStr = `${dirpath}/${dateFile}.stormdb`;
    const dbEngine = new StormDB.localFileEngine(dateFileStr, {
      async: false,
    });
    this.priceHistDb = new StormDB(dbEngine);
  }

  addPriceHistory(lastPrice) {
    this.priceHistDb.default({ history: [] });
    const time = (new Date()).getTime();
    if (!lastPrice) return;
    this.priceHistDb.get('history').push({ t: time, p: lastPrice });
    this.priceHistDb.save(); // async
  }
}

module.exports = SavePriceHistory;