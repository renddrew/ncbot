<template>
  <div class="hello">

    <!-- TradingView Widget BEGIN -->
    <div class="tradingview-widget-container">
      <div id="tradingview_3194a"></div>
    </div>
    <!-- TradingView Widget END -->

    <h1 class="has-text-primary is-size-3 is-size-4-mobile">
      BTCUSDT: <span class="has-text-weight-bold">${{ socket.message.lastPrice }}</span>
    </h1>

    Holding:
    <strong>BTC:</strong> {{ balances.BTC && balances.BTC.available ? balances.BTC.available : ''}}
    <strong>USDT:</strong> ${{ balances.USDT && balances.USDT.available ? parseFloat(balances.USDT.available).toFixed(2) : ''}}

    <br>

    Wallet Value:
     <strong>BTC:</strong> {{ totalValues.btcTotal }}
     <strong>USDT:</strong> ${{ totalValues.usdtTotal }}
    <br>
    <br>

    <b-table :data="trades" :mobileCards=false>
      <b-table-column field="isBuyer" v-slot="props">
          <span :class="['tag', props.row.isBuyer ? 'is-success' : 'is-danger']">
              {{ props.row.isBuyer ? 'Buy' : 'Sell' }}
          </span>
      </b-table-column>
      <b-table-column field="niceTime" v-slot="props" label="Date">
        {{ props.row.niceTime }}
      </b-table-column>
      <b-table-column field="qty" v-slot="props" label="Qty BTC">
        {{ props.row.qty }}
      </b-table-column>
      <b-table-column field="price" v-slot="props" label="BTC rice">
        ${{ props.row.price }}
      </b-table-column>
      <b-table-column field="quoteQty" v-slot="props" label="Trade Amt">
        ${{ props.row.quoteQty }}
      </b-table-column>
    </b-table>

  </div>
</template>

<script>

import store from '@/store';
var moment = require('moment');
import Vue from 'vue';
import Vuex from 'vuex';
import VueNativeSock from 'vue-native-websocket'

Vue.use(VueNativeSock, process.env.VUE_APP_WS_URL, {
  store,
  reconnection: true, // (Boolean) whether to reconnect automatically (false)
  reconnectionAttempts: 5, // (Number) number of reconnection attempts before giving up (Infinity),
  reconnectionDelay: 3000, // (Number) how long to initially wait before attempting a new (1000)
  format: 'json'
})

import { mapState } from 'vuex';

export default {
  name: 'HelloWorld',
  data() {
    return {
      msg: null,
      trades: [],
      balances: [],
    }
  },

  computed: {
    ...mapState([
      'socket'
    ]),
    
    totalValues() {
      const lastPrice = parseFloat(this.socket.message.lastPrice);
      const btcWallet = this.balances.BTC && this.balances.BTC.available ? parseFloat(this.balances.BTC.available) : 0;
      const usdtWallet = this.balances.USDT && this.balances.USDT.available ? parseFloat(this.balances.USDT.available) : 0;
      const btcTotal = ((usdtWallet / lastPrice) + btcWallet).toFixed(5);
      const usdtTotal = ((lastPrice * btcWallet) + usdtWallet).toFixed(2);
      return { btcTotal, usdtTotal };
    }
  },

  methods: {
    async getTrades() {
      let tradeReq = await (await fetch(`${process.env.VUE_APP_HTTP_URL}/getTrades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
      })).json();

      let trades = Array.isArray(tradeReq.trades) ? tradeReq.trades : [];
      for (let i = 0; i < trades.length; i++) {
        trades[i].niceTime = moment.unix(trades[i].time/1000).format('DD/MM/YY h:mm a');
      }
      this.trades = trades;
    },

    async getBalances() {
      const balancesRes = await (await fetch(`${process.env.VUE_APP_HTTP_URL}/getBalances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
      })).json();

      let balances = balancesRes.balances || {};
      
      this.balances = balances;
    },

    niceTime(ts) {
      return moment.unix(ts/1000).format('MMM Do YYYY h:mm a')
    },
  },

  mounted() {
    this.getTrades();
    this.getBalances();

     new TradingView.widget({
      "width": '100%',
      "autosize": false,
      "symbol": "BINANCE:BTCUSDT",
      "interval": "1",
      "timezone": "America/Toronto",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#f1f3f6",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "studies": [
        "BB@tv-basicstudies",
        "RSI@tv-basicstudies"
      ],
      "container_id": "tradingview_3194a"
    });
  }
};

</script>

<style scoped lang="scss">
  h1 {
    padding: 10px
  }
</style>

<style lang="scss">
  .table {
    max-width:600px;
    margin: 0 auto;
  td{
    &.text-align-left {
      span {
        display: block;
        text-align:left
      }
    }
  }
}

</style>
