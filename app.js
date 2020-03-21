
const marketMaker = require('./marketMaker')
const fs = require('fs')
var ourCoins = JSON.parse(fs.readFileSync('./ourCoins', 'utf8'))
const {millisToNoon, millisToMidnight, millisTo22pm, millisTo23pm} = require('./timing')
const {distribute} = require('./distributeKMD')
const ltf = require('./logToFile')

ltf.log('app restarted');

// connects the market maker to all the coins we want to trade in
ourCoins.forEach(coin => {
  marketMaker.connectCoin(coin)
})

const rain = () => {
  // creates maker sell orders (to KMD) for all coin balances except KMD
  console.log('placeOrders will run in ', millisToNoon/(1000*60*60), 'hours')
  setTimeout(() => {
    marketMaker.placeOrders(ourCoins)
    setInterval(() => {
      marketMaker.placeOrders(ourCoins)
    }, 24*60*60*1000) // wait 24 hours after first attempt
  }, millisToNoon) // first attempt at noon

  // cancels all open orders roughly after they lived for 10 hours
  console.log('cancelOrders will run in ', millisTo22pm/(1000*60*60), 'hours')
  setTimeout(() => {
    marketMaker.cancelOrders()
    setInterval(() => {
      marketMaker.cancelOrders()
    }, 24*60*60*1000) // wait 24 hours after first attempt
  }, millisTo22pm) // first attempt at 22pm

  // sends all collected KMD to the distributor address
  console.log('sendKMDtoDistributor will run in ', millisTo23pm/(1000*60*60), 'hours')
  setTimeout(() => {
    marketMaker.sendKMDtoDistributor(ourCoins[0])
    setInterval(() => {
      marketMaker.sendKMDtoDistributor(ourCoins[0])
    }, 24*60*60*1000) // wait 24 hours after first attempt
  }, millisTo23pm) // first attempt at 23pm

  // distribute available KMD to CCL holders
  console.log('distribute will run in ', millisToMidnight/(1000*60*60), 'hours')
  setTimeout(() => {
    distribute()
    setInterval(() => {
      distribute()
    }, 24*60*60*1000) // wait 24 hours after first attempt
  }, millisToMidnight) // first attempt at midnight
}

setTimeout(() => { //allow for 30 secs for connecting to all ourCoins
  rain()
},30000)
