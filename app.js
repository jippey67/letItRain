const {millisToNoon, millisToMidnight} = require('./timing')
const {distribute} = require('./distributeKMD')

const rain = () => {
  setTimeout(() => {
    distribute() // wait to midnight for first distrubution
    setInterval(() => {
      distribute()
    }, 24*60*60*1000) // wait 24 hours after first attempt
  }, millisToMidnight) // first attempt at next midnight
}

rain()
