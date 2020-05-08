
const marketMaker = require('./marketMaker')
const fs = require('fs')
var ourCoins = JSON.parse(fs.readFileSync('./ourCoins', 'utf8'))
const {distribute} = require('./distributeKMD')
const ltf = require('./logToFile')

ourCoins.forEach(coin => {
  marketMaker.connectCoin(coin)
})
