const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const binanceRequests = require('./backend/binance-requests')
const GetRanges = require('./backend/get-ranges')
const AppSettings = require('./backend/app-settings')
const TradeLog = require('./backend/trade-log')

const app = express()
app.use(cors())
app.use(bodyParser.json({ extended: true }))

app.use(express.static('dist'))

app.post('/getTrades', async (req, res) => {
  const data = await binanceRequests.getTrades()
  res.send(data)
})

app.post('/getBalances', async (req, res) => {
  const data = await binanceRequests.getBalances()
  res.send({ balances: data })
})

app.post('/getRanges', async (req, res) => {
  const ranges = new GetRanges()
  const rangeVals = ranges.getPeriodHistory()
  res.send({ rangeVals })
})

app.post('/marketBuy', async (req, res) => {
  const result = await binanceRequests.marketBuy()
  res.send({ result })
})

app.post('/marketSell', async (req, res) => {
  const result = await binanceRequests.marketSell()
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

module.exports = app
