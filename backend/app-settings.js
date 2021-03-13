const StormDB = require('stormdb');
const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs');
const utils = require('./utils');
const { _ } = require('core-js');

moment.tz.setDefault("Africa/Abidjan"); // set UTC 0

// https://www.npmjs.com/package/stormdb

const AppSettings = class {
  constructor() {
    const dbLocation = './backend/db/appSettings.stormdb';
    let engine = new StormDB.localFileEngine(dbLocation);
    this.db = new StormDB(engine);
    this.db.default({ settings: {} });
  }

  getSettings() {
    return this.db.get('settings').value();
  }

  saveSettings(obj) {
    return this.db.set(obj).save();
  }

}

module.exports = AppSettings;





