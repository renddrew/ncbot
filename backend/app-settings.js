const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const moment = require('moment-timezone');
moment.tz.setDefault("Africa/Abidjan"); // set UTC 0
const AppSettings = class {
  constructor() {
    const fileLocation = './backend/db/appSettings.json';
    const adapter = new FileSync(fileLocation);
    this.db = low(adapter);
    this.db.defaults({ settings: {} }).write();
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
      this.db.set('settings', settings).write();
      resolve('success');
    });
  }
};

module.exports = AppSettings;
