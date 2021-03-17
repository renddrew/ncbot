const moment = require('moment-timezone');
const fs = require('fs');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

moment.tz.setDefault("Africa/Abidjan"); // set UTC 0

const SavePriceHistory = class {
  constructor(lastPrice) {
    this.lastPrice = lastPrice;
    this.savePrice();
  }

  // should move database class inst to be global shared, could be causing data loss somehow
  savePrice() {
    const dirpath = './backend/db/btcusdt';
    fs.mkdirSync(dirpath, { recursive: true });
    const dateFile = moment().format('YYYY-MM-DD-H');
    const adapter = new FileSync(`${dirpath}/${dateFile}.json`);
    const db = low(adapter);
    db.defaults({ history: [] }).write();
    const time = (new Date()).getTime();
    if (!this.lastPrice) return;
    db.get('history').push({ t: time, p: this.lastPrice }).write();
  }
};

module.exports = SavePriceHistory;