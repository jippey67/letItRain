const marketMaker = require('./allToKMD/marketMaker')
const fs = require('fs')
var ourCoins = JSON.parse(fs.readFileSync('./ourCoins', 'utf8'))

marketMaker.placeOrders(ourCoins)
