const StormDB = require('stormdb');
const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs');
const utils = require('./utils');

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
    const dateFile = moment().tz('America/Toronto').format('YYYY-MM-DD-H');
    const dirpath = './backend/db/btcusdt';
    fs.mkdirSync(dirpath, { recursive: true });
    const dateFileStr = `${dirpath}/${dateFile}.stormdb`;
    const dbEngine = new StormDB.localFileEngine(dateFileStr, {
      async: true,
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