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
    let engine = new StormDB.localFileEngine(dbLocation, { async: true });
    this.db = new StormDB(engine);
    this.db.default({ settings: {} });
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

module.exports = AppSettings;
