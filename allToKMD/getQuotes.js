const CoinpaprikaAPI = require('@coinpaprika/api-nodejs-client')
const fs = require('fs')
const client = new CoinpaprikaAPI();
var ourCoins = JSON.parse(fs.readFileSync('./ourCoins', 'utf8'))

console.log(ourCoins)
const coins = []
ourCoins.forEach(coin => {
  coins.push(coin.name)
})
console.log(coins)

client.getAllTickers({}).then(tickerObj => {
  tickerObj.forEach(ticker => {
    if (coins.indexOf(ticker.symbol) !== -1) {
      console.log(ticker.symbol, ticker.quotes.USD.price)
    }
  })
})
