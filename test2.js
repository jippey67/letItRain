const marketMaker = require('./allToKMD/marketMaker')
const fs = require('fs')
var ourCoins = JSON.parse(fs.readFileSync('./ourCoins', 'utf8'))


ourCoins.forEach(coin => {
  marketMaker.connectCoin(coin)
})

setTimeout(() => {
  marketMaker.placeOrders(ourCoins)
}, 5000)
