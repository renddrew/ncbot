const express = require('express');
const cors = require('cors');
const binanceRequests = require('./backend/binance-requests');

const app = express();
app.use(cors());

app.use(express.static('dist'));

app.post('/getTrades', async (req, res) => {
  const data = await binanceRequests.getTrades();
  res.send(data);
});

app.post('/getBalances', async (req, res) => {
  const data = await binanceRequests.getBalances();
  res.send({balances:data});
});

module.exports = app;