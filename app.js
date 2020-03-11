
const marketMaker = require('./allToKMD/marketMaker')

const {millisToNoon, millisToMidnight, millisTo22pm, illisTo23pm} = require('./timing')
const {distribute} = require('./distributeKMD')

const rain = () => {
  // creates maker sell orders (to KMD) for all coin balances except KMD



  // cancels all open orders roughly after 10 hours
  setTimeout(() => {
    marketMaker.cancelOrders()
    setInterval(() => {
      marketMaker.cancelOrders()
    }, 24*60*60*1000) // wait 24 hours after first attempt
  }, millisTo22pm) // first attempt at 22pm

  // sends all collected KMD to the dsitributor address
  setTimeout(() => {
    marketMaker.sendKMDtoDistributor(ourCoins[0])
    setInterval(() => {
      marketMaker.sendKMDtoDistributor(ourCoins[0])
    }, 24*60*60*1000) // wait 24 hours after first attempt
  }, millisTo23pm) // first attempt at 23pm


  // distribute available KMD to CCL holders
  setTimeout(() => {
    distribute()
    setInterval(() => {
      distribute()
    }, 24*60*60*1000) // wait 24 hours after first attempt
  }, millisToMidnight) // first attempt at midnight
}

setTimeout(() => { //allow for 60 secs for connecting to all ourCoins
  rain()
},60000)
