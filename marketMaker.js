const CoinpaprikaAPI = require('@coinpaprika/api-nodejs-client')
const client = new CoinpaprikaAPI();
const fs = require('fs')
const ltf = require('./logToFile')
var ourCoins = JSON.parse(fs.readFileSync('./ourCoins', 'utf8'))

const { exec } = require('child_process');
const userpass = process.env.USERPASS
// connect the marketmaker to the specified coin
module.exports.connectCoin = (coin) => {
  var url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"electrum\\",\\"coin\\":\\"${coin.name}\\",\\"servers\\":[`
  coin.electrums.forEach((electrum) => {
    url += `{\\"url\\":\\"${electrum}\\"},`
  })
  url = url.slice(0, -1);
  url += `]}"`
  const command = `curl --url ` + url
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(error.stack);
      console.log('Error code: '+error.code);
      console.log('Signal received: '+error.signal);
    }
    ltf.log('Connection result: '+stdout)
  })
}

//updates balance of the specified coin
updateBalance = (coin) => {
  const url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"my_balance\\",\\"coin\\":\\"${coin.name}\\"}"`
  const command = `curl --url ` + url
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(error.stack);
      console.log('Error code: '+error.code);
      console.log('Signal received: '+error.signal);
    }
    coin.balance = JSON.parse(stdout).balance
    ltf.log(JSON.stringify(coin))
  })
}

//place orders selling the all (non-KMD) coins for KMD
module.exports.placeOrders = (allCoins) => {
  // update balances for all coins first
  allCoins.forEach(coin => {
    updateBalance(coin)
  })
  // then update the US$ quotes for all coins
  client.getAllTickers({}).then(tickerObj => {
    tickerObj.forEach(ticker => {
      if (allCoins.findIndex(coin => coin.name == ticker.symbol) !== -1) {
        allCoins.find(coin => coin.name == ticker.symbol).price_usd = ticker.quotes.USD.price
      }
    })
  })
  setTimeout(() => {
    const kmdCoin = allCoins[0]
    ltf.log(JSON.stringify(allCoins))
    allCoins.forEach(coin => {
      if ((coin.balance * coin.price_usd > 1.0) && (coin.balance > 0.008) && (coin.name != 'KMD')) { //only create orders for balance with an equivalent value larger than 1 US$, orders for which the balance larger than 0.00777, and no KMD
        const balanceToSell = 0.98 * coin.balance // keep 2% for fees
        const priceToOffer = 0.95 * coin.price_usd/kmdCoin.price_usd // offer an attractive price such that trade will follow through with high probability
        const url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"setprice\\",\\"base\\":\\"${coin.name}\\",\\"rel\\":\\"KMD\\",\\"price\\":\\"${priceToOffer}\\",\\"volume\\":\\"${balanceToSell}\\"}"`
        const command = `curl --url ` + url
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.log(error.stack);
            console.log('Error code: '+error.code);
            console.log('Signal received: '+error.signal);
          }
          ltf.log('placed order: '+stdout);
        })
      }
    })
  }, 5000) // wait 5 secs to perform this
}

//view all open orders on marketmaker
module.exports.viewOrders = () => {
  const url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"my_orders\\"}"`
  const command = `curl --url ` + url
  exec(command, function (error, stdout, stderr) {
    if (error) {
      console.log(error.stack);
      console.log('Error code: '+error.code);
      console.log('Signal received: '+error.signal);
    }
    console.log('Open orders: '+(stdout));
  })
}

//cancel all open orders on marketmaker
module.exports.cancelOrders = () => {
  const url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"cancel_all_orders\\",\\"cancel_by\\":{\\"type\\":\\"All\\"}}"`
  const command = `curl --url ` + url
  exec(command, function (error, stdout, stderr) {
    if (error) {
      console.log(error.stack);
      console.log('Error code: '+error.code);
      console.log('Signal received: '+error.signal);
    }
    ltf.log('Cancelled orders: '+(stdout));
  })
}

//send all obtained KMD to the distributor address
module.exports.sendKMDtoDistributor = (coin) => {
  var kmdBalance = 0
  if (coin.name == 'KMD') {
    kmdBalance = coin.balance - 0.001 // subtract transaction fee
    ltf.log('KMD balance: ' + kmdBalance)
    if (kmdBalance > 0.9) {
      const url = `"http://127.0.0.1:7783" --data "{\\"method\\":\\"withdraw\\",\\"coin\\":\\"KMD\\",\\"to\\":\\"RXEbBErWKAKvAbtdBvk9PivvHMejwstJbF\\",\\"amount\\":\\"${kmdBalance}\\",\\"userpass\\":\\"${userpass}\\"}"`
      const command = `curl --url ` + url
      ltf.log(command)
      exec(command, function (error, stdout, stderr) {
        if (error) {
          console.log(error.stack);
          console.log('Error code: '+error.code);
          console.log('Signal received: '+error.signal);
        }
        const txHex = JSON.parse(stdout).tx_hex
        ltf.log('created KMD transaction string: '+ txHex + '\n');
        const url = `"http://127.0.0.1:7783" --data "{\\"method\\":\\"send_raw_transaction\\",\\"coin\\":\\"KMD\\",\\"tx_hex\\":\\"${txHex}\\",\\"userpass\\":\\"${userpass}\\"}"`
        const command = `curl --url ` + url
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.log(error.stack);
            console.log('Error code: '+error.code);
            console.log('Signal received: '+error.signal);
          }
          ltf.log('Sent KMD transaction string, result: '+stdout);
        })
      })
    }
  }
}
