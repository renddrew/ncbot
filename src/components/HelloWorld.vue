<template>
  <div class="hello">

    <!-- TradingView Widget BEGIN -->
<div class="tradingview-widget-container">
  <div id="tradingview_3194a"></div>
</div>
<!-- TradingView Widget END -->

    <h1>BTCUSDT: {{ socket.message }}</h1>
    <ul>
      <li v-for="(t, i) in trades">
        {{niceTime(t.time)}} - {{t.qty}} - {{t.price}} - {{t.quoteQty}}
      </li>
    </ul>
  </div>
</template>

<script>

import store from '@/store'
var moment = require('moment');
import Vue from 'vue';
import Vuex from 'vuex';
import VueNativeSock from 'vue-native-websocket'

Vue.use(VueNativeSock, process.env.VUE_APP_WS_URL, { 
  store: store,
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
      trades: []
    }
  },

  computed: {
    ...mapState([
      'socket'
    ]),
  },

  methods: {
    async getTrades () {
      let tradeReq = await (await fetch(`${process.env.VUE_APP_HTTP_URL}/getTrades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
      })).json()
      this.trades = Array.isArray(tradeReq.trades) ? tradeReq.trades : []
    },

    niceTime(ts) {
      return moment.unix(ts/1000).format('MMM Do YYYY h:mm a')
    },
  },

  mounted() {
    this.getTrades();

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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

#tradingview_3194a iframe {

}

</style>
