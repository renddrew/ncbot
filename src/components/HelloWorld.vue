<template>
  <div class="hello">

    <!-- TradingView Widget BEGIN -->
    <div class="tradingview-widget-container">
      <div id="tradingview_3194a"></div>
    </div>
    <!-- TradingView Widget END -->

    <h1 class="has-text-primary is-size-3 is-size-4-mobile" @click=reload>
      BTCUSDT: <span class="has-text-weight-bold">${{ socket.message.lastPrice }}</span>
    </h1>

    Holding:
    <strong>{{ this.coin }}</strong> {{ balances[this.coin] && balances[this.coin].available ? (parseFloat(balances[this.coin].available) + parseFloat(balances[this.coin].onOrder)).toFixed(6) : ''}}
    <strong>USDT:</strong> ${{ balances.USDT && balances.USDT.available ? (parseFloat(balances.USDT.available) + parseFloat(balances.USDT.onOrder)).toFixed(2) : ''}}

    <br>

    On Order:
    <strong>{{ coin }}:</strong> {{ balances[this.coin] && balances[this.coin].onOrder ? parseFloat(balances[this.coin].onOrder).toFixed(6) : ''}}
    <strong>USDT:</strong> ${{ balances.USDT && balances.USDT.onOrder ? parseFloat(balances.USDT.onOrder).toFixed(2) : ''}}

    <br>

    Wallet Value:
     <strong>{{ coin }}</strong> {{ totalValues.coinTotal }}
     <strong>USDT:</strong> ${{ totalValues.usdtTotal }}
    <br>

    <b-taglist class="is-centered" style="padding:10px">
      <b-tag :type="ranges.longUptrend ? 'is-success' : 'is-danger'">4 hr</b-tag>
      <b-tag :type="ranges.mediumUptrend ? 'is-success' : 'is-danger'">1.5 hr</b-tag>
      <b-tag :type="ranges.shortUptrend ? 'is-success' : 'is-danger'">30 min</b-tag>
    </b-taglist>

    <div class="action-buttons buttons is-centered">
      <b-button @click="marketSell" type="is-danger" outlined>Sell</b-button>
      <b-button @click="marketBuy" type="is-success" outlined>Buy</b-button>
    </div>

    <!-- <div>
      <b-field label="Auto Trade">
        <b-select
          v-model="autoTrade"
          placeholder="Auto Trading"
          @input="saveSettings"
        >
          <option
            v-for="option in [{ name: 'On', val: 'on'},{ name: 'Off', val: 'off' }]"
            :value="option.val"
            :key="option.val">
            {{ option.name }}
          </option>
        </b-select>
      </b-field>
    </div> -->

    <b-field label="Pair">
      <b-select
        v-model="pair"
        placeholder="Select"
        @input="reload"
      >
        <option
          v-for="option in pairs"
          :value="option"
          :key="option">
          {{ option }}
        </option>
      </b-select>
    </b-field>
<!-- 
    <a
      v-if="!showTradeLog"
      v-html="'Show Trades'"
      @click="getTradeLog(true)"
       class="is-link"
      style="display:inline-block;margin:10px;text-decoration:underline"
    />
    <a
      v-if="!showTradeLog"
      v-html="'Show Log'"
      @click="getTradeLog()"
      class="is-link"
      style="display:inline-block;margin:10px;text-decoration:underline"
    />
    <a
      v-if="showTradeLog"
      v-html="'Hide Log'"
      @click="showTradeLog = false"
      class="is-link"
      style="display:inline-block;margin:10px;text-decoration:underline"
    /> -->

    <div v-if="showTradeLog" class="trade-log has-text-left has-text-underlined">
      <pre>
        {{ tradeLog }}
      </pre>
    </div>

    <b-table :data="trades" :mobileCards=false class="is-size-7-mobile">
      <b-table-column field="isBuyer" v-slot="props">
          <span :class="['tag', props.row.isBuyer ? 'is-success' : 'is-danger']">
              {{ props.row.isBuyer ? 'Buy' : 'Sell' }}
          </span>
      </b-table-column>
      <b-table-column field="niceTime" v-slot="props" label="Date">
        {{ props.row.niceTime }}
      </b-table-column>
      <b-table-column field="qty" v-slot="props" label="Coin Qty">
        {{ props.row.qty }}
      </b-table-column>
      <b-table-column field="price" v-slot="props" label="Coin Price">
        ${{ props.row.price }}
      </b-table-column>
      <b-table-column field="quoteQty" v-slot="props" label="Trade Amt">
        ${{ props.row.quoteQty }}
      </b-table-column>
    </b-table>

  </div>
</template>

<script>

import Vue from 'vue'
import VueNativeSock from 'vue-native-websocket'
import store from '@/store'

import { mapState } from 'vuex'

const moment = require('moment')

Vue.use(VueNativeSock, process.env.VUE_APP_WS_URL, {
  store,
  reconnection: true, // (Boolean) whether to reconnect automatically (false)
  reconnectionAttempts: 5, // (Number) number of reconnection attempts before giving up (Infinity),
  reconnectionDelay: 3000, // (Number) how long to initially wait before attempting a new (1000)
  format: 'json'
})

export default {
  name: 'HelloWorld',
  data () {
    return {
      pair: 'BTCUSDT',
      msg: null,
      trades: [],
      balances: [],
      ranges: {},
      autoTrade: 'off',
      tradeLog: [],
      showTradeLog: false,
      pairs: [
        'BTCUSDT',
        'ADAUSDT',
        'EOSUSDT'
      ]
    }
  },

  computed: {
    ...mapState([
      'socket'
    ]),

    totalValues () {
      const lastPrice = parseFloat(this.socket.message.lastPrice)
      const btcWallet = this.balances[this.coin] && this.balances[this.coin].available ? parseFloat(this.balances[this.coin].available) + parseFloat(this.balances[this.coin].onOrder) : 0
      const usdtWallet = this.balances.USDT && this.balances.USDT.available ? parseFloat(this.balances.USDT.available) + parseFloat(this.balances.USDT.onOrder) : 0
      const coinTotal = ((usdtWallet / lastPrice) + btcWallet).toFixed(5)
      const usdtTotal = ((lastPrice * btcWallet) + usdtWallet).toFixed(2)
      return { coinTotal, usdtTotal }
    },

    coin() {
      if (this.pair.substr(-4) === 'USDT') {
        return this.pair.substring(-3, 3)
      }
      return ''
    }
  },

  methods: {
    async getTrades () {
      const body = JSON.stringify({ pair: this.pair })
      const tradeReq = await (await fetch(`${process.env.VUE_APP_HTTP_URL}/getTrades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body
      })).json()

      const trades = Array.isArray(tradeReq.trades) ? tradeReq.trades : []
      for (let i = 0; i < trades.length; i++) {
        trades[i].niceTime = moment.unix(trades[i].time / 1000).format('DD/M h:mma')
      }
      this.trades = trades
      this.$buefy.snackbar.open({ message: 'got trades', duration: 500 })
    },

    async getBalances () {
      const balancesRes = await (await fetch(`${process.env.VUE_APP_HTTP_URL}/getBalances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })).json()
      this.$buefy.snackbar.open({ message: 'got balances', duration: 500 })
      const balances = balancesRes.balances || {}
      this.balances = balances
    },

    async getRanges () {
      const rangeRes = await (await fetch(`${process.env.VUE_APP_HTTP_URL}/getRanges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })).json()
      this.$buefy.snackbar.open({ message: 'got ranges', duration: 500 })
      this.ranges = rangeRes.rangeVals
    },

    marketBuy () {
      const body = JSON.stringify({ pair: this.pair })
      this.$buefy.dialog.confirm({
        message: `Confirm buy ${this.pair}?`,
        type: 'is-success',
        onConfirm: async () => {
          const res = await (await fetch(`${process.env.VUE_APP_HTTP_URL}/marketBuy`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body
          })).json()

          if (res && res.result === 'buy') {
            this.$buefy.snackbar.open({ message: 'buy success', duration: 1500 })
            setTimeout(() => {
              this.getBalances()
              this.getTrades()
            }, 500)
          } else {
            this.$buefy.snackbar.open({ message: res.result, duration: 5000, type: 'is-danger' })
            console.log(res)
          }
        }
      })
    },

    marketSell () {
      this.$buefy.dialog.confirm({
        message: `Confirm sell ${this.pair}?`,
        type: 'is-danger',
        onConfirm: async () => {
          const body = JSON.stringify({ pair: this.pair })
          const res = await (await fetch(`${process.env.VUE_APP_HTTP_URL}/marketSell`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body
          })).json()

          if (res && res.result === 'sell') {
            this.$buefy.snackbar.open({ message: 'sell success', duration: 1500 })
            setTimeout(() => {
              this.getBalances()
              this.getTrades()
            }, 500)
          } else {
            this.$buefy.snackbar.open({ message: res.result, duration: 5000, type: 'is-danger' })
            console.log(res)
          }
        }
      })
    },

    async getSettings () {
      const res = await (await fetch(`${process.env.VUE_APP_HTTP_URL}/getSettings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })).json()

      if (res.autoTrade) {
        this.$buefy.snackbar.open({ message: 'got settings', duration: 500, type: 'is-success' })
        this.autoTrade = res.autoTrade
      }
    },

    async saveSettings () {
      const body = JSON.stringify({ autoTrade: this.autoTrade })
      const res = await (await fetch(`${process.env.VUE_APP_HTTP_URL}/saveSettings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body
      })).json()
      if (res === 'success') {
        this.$buefy.snackbar.open({ message: 'Saved', duration: 500, type: 'is-success' })
      } else {
        this.$buefy.snackbar.open({ message: 'Save failed', duration: 5000, type: 'is-danger' })
      }
      console.log(res)
    },

    niceTime (ts) {
      return moment.unix(ts / 1000).format('MMM Do YYYY h:mm a')
    },

    async getTradeLog (tradesOnly) {
      const params = {}
      if (tradesOnly) {
        params.filterTrades = true
      }
      console.log(params)
      const res = await (await fetch(`${process.env.VUE_APP_HTTP_URL}/getTradeLog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })).json()

      if (res.data) {
        this.tradeLog = res.data
        this.showTradeLog = true
      }
    },

    reload () {
      this.getTrades()
      this.getBalances()
      this.getRanges()
      this.getSettings()
    }
  },

  mounted () {
    this.reload()

    new TradingView.widget({
      width: '100%',
      autosize: false,
      symbol: 'BINANCE:BTCUSDT',
      interval: '5',
      timezone: 'America/Toronto',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: true,
      studies: [
        'BB@tv-basicstudies',
        'RSI@tv-basicstudies'
      ],
      container_id: 'tradingview_3194a'
    })
  }
}

</script>

<style scoped lang="scss">
  h1 {
    padding: 10px
  }
</style>

<style lang="scss">
  .table {
    width:100%!important;
    margin: 0 auto;
    max-width:800px!important;
    td {
      padding: 6px 2px!important;
      &.text-align-left {
        span {
          display: block;
          text-align:left
        }
      }
    }
  }
  .tags {
    .tag {
      min-width:60px;
    }
  }

  .trade-log {
    max-height:400px;
    overflow-y:scroll;
    margin: 20px;
  }

</style>
