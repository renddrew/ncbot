const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const binanceRequests = require('./backend/binance-requests')
const GetRanges = require('./backend/get-ranges')
const AppSettings = require('./backend/app-settings')
const TradeLog = require('./backend/trade-log')
const { response } = require('express')

const app = express()
app.use(cors())
app.use(bodyParser.json({ extended: true }))

app.use(express.static('dist'))

app.post('/getTrades', async (req, res) => {
  let pair = '';
  if (!req.body || !req.body.pair) {
    res.send('missing pair');
    return;
  }
  const data = await binanceRequests.getTrades(req.body.pair)
  res.send(data)
})

app.post('/getBalances', async (req, res) => {
  const data = await binanceRequests.getBalances()
  res.send({ balances: data })
})

app.post('/getRanges', async (req, res) => {
  const ranges = new GetRanges(6) // 6 histhours
  const rangeVals = ranges.getPeriodHistory()
  res.send({ rangeVals })
})

app.post('/marketBuy', async (req, res) => {
  const qty = null;
  if (!req.body || !req.body.pair) {
    res.send('pair required');
    return;
  }
  const result = await binanceRequests.marketBuy(qty, req.body.pair)
  res.send({ result })
})

app.post('/marketSell', async (req, res) => {
  const qty = null;
  if (!req.body || !req.body.pair) {
    res.send('pair required');
    return;
  }
  const result = await binanceRequests.marketSell(qty, req.body.pair)
  res.send({ result })
})

app.post('/saveSettings', async (req, res) => {
  const ap = new AppSettings()
  const result = await ap.saveSettings(req.body)
  res.send(JSON.stringify(result))
})

app.post('/getSettings', async (req, res) => {
  const ap = new AppSettings()
  const result = await ap.getSettings('settings')
  res.send(result)
})

app.post('/getTradeLog', async (req, res) => {
  const tl = new TradeLog()
  const params = {}
  if (req.body && req.body.filterTrades) {
    params.filterTrades = req.body.filterTrades
  }
  let data = await tl.getLogs(params)

  data = data.slice(0, 100);

  res.send({ data })
})

// curl -H 'Content-Type: application/json; charset=utf-8' -d '{"action": "sell","close": "123"}' -X POST https://ncb2.devitup.site/tradingViewTrade
app.post('/tradingViewTrade', async (req, res) => {
  const action = req.body && req.body.action ? req.body.action : null
  const pair = req.body && req.body.pair ? req.body.pair : null
  const qty = null
  let result = null
  if (action === 'buy') {
    result = await binanceRequests.marketBuy(qty, pair)
  } else if (action === 'sell') {
    result = await binanceRequests.marketSell(qty, pair)
  }
  res.send(result)
})

module.exports = app