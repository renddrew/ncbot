const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const binanceRequests = require('./backend/binance-requests');
const GetRanges = require('./backend/get-ranges');
const AppSettings = require('./backend/app-settings');

const app = express();
app.use(cors());
app.use(bodyParser.json({ extended: true }));

app.use(express.static('dist'));

app.post('/getTrades', async (req, res) => {
  const data = await binanceRequests.getTrades();
  res.send(data);
});

app.post('/getBalances', async (req, res) => {
  const data = await binanceRequests.getBalances();
  res.send({balances:data});
});

app.post('/getRanges', async (req, res) => {
  const ranges = new GetRanges();
  const rangeVals = ranges.getPeriodHistory();
  res.send({ rangeVals });
});

app.post('/marketBuy', async (req, res) => {
  const result = await binanceRequests.marketBuy();
  res.send({ result });
});

app.post('/marketSell', async (req, res) => {
  const result = await binanceRequests.marketSell();
  res.send({ result });
});

app.post('/saveSettings', async (req, res) => {
  const obj = { setting1: 'on' };
  const ap = new AppSettings();
  const result = await ap.saveSettings(req.body);
  res.sendStatus(200);
});

app.post('/getSettings', async (req, res) => {
  const ap = new AppSettings();
  const result = await ap.getSettings('settings');
  res.send(result);
});



module.exports = app;