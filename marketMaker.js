const CoinpaprikaAPI = require('@coinpaprika/api-nodejs-client')
const client = new CoinpaprikaAPI();
const fs = require('fs')
const ltf = require('./logToFile')
var ourCoins = JSON.parse(fs.readFileSync('./ourCoins', 'utf8'))

const { exec } = require('child_process');
const userpass = process.env.USERPASS
// connect the marketmaker to the specified coin and logs the result
module.exports.connectCoin = (coin) => {
  var url;
  if (coin.method == 'electrum') { // connect to UTXO based coins
    url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"electrum\\",\\"coin\\":\\"${coin.name}\\",\\"servers\\":[`
    coin.electrums.forEach((electrum) => {
      url += `{\\"url\\":\\"${electrum}\\"},`
    })
    url = url.slice(0, -1);
    url += `]}"`
  }
  else if (coin.method == 'enable') { // connect to ETH / ERC20 coins
    url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"enable\\",\\"coin\\":\\"${coin.name}\\",\\"urls\\":[`
    coin.urls.forEach((server) => {
      url += `\\"${server}\\",`
    })
    url = url.slice(0, -1);
    url += `],\\"swap_contract_address\\":\\"0x8500AFc0bc5214728082163326C2FF0C73f4a871\\"}"`
  }
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

//helper function to sort (descending) an array of JSON objects on a key's values
getSortOrder = (prop) => {
    return function(a, b) {
        if (a[prop] > b[prop]) {
            return -1;
        } else if (a[prop] < b[prop]) {
            return 1;
        }
        return 0;
    }
}

//updates balance of the specified coin and logs the result
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
    //ltf.log(JSON.stringify(coin))
  })
}

getBestBid = (coin) => {
  const url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"orderbook\\",\\"base\\":\\"${coin.name}\\",\\"rel\\":\\"KMD\\"}"`
  const command = `curl --url ` + url
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(error.stack);
      console.log('Error code: '+error.code);
      console.log('Signal received: '+error.signal);
    }
    var bids = JSON.parse(stdout).bids
    if (bids.length != 0) {
      bids.sort(getSortOrder("price"))
      coin.bestBidPrice = bids[0].price
      coin.bestBidMaxVol = bids[0].maxvolume
    }
  })
}

//place orders selling all (non-KMD) coins for KMD
module.exports.placeOrders = (allCoins) => {
  // update balances and remove old price and orderbook info for all coins first
  allCoins.forEach(coin => {
    delete coin.balance
    delete coin.price_usd
    delete coin.bestBidPrice
    delete coin.bestBidMaxVol
    updateBalance(coin)
    if (coin.name != 'KMD') {
      getBestBid(coin)
    }
  })
  // then update the US$ quotes for all coins
  client.getAllTickers({}).then(tickerObj => {
    tickerObj.forEach(ticker => {
      if (allCoins.findIndex(coin => coin.name == ticker.symbol) !== -1) {
        allCoins.find(coin => coin.name == ticker.symbol).price_usd = ticker.quotes.USD.price
      }
    })
  })
  // and finally create the orders
  setTimeout(() => {
    const kmdCoin = allCoins[0]
    allCoins.forEach(coin => {
      ltf.log(JSON.stringify(coin))
      if ((coin.balance * coin.price_usd > 1.0) && (coin.balance > 0.008) && (coin.name != 'KMD')) { //only create orders for balance with an equivalent value larger than 1 US$, orders for which the balance larger than 0.00777, and no KMD
        var balanceToSell = 0.98 * coin.balance // keep 2% for fees
        const priceToOffer = 0.95 * coin.price_usd/kmdCoin.price_usd // offer an attractive price such that trade will follow through with high probability
        if (coin.bestBidPrice > priceToOffer) { // market offers more than we woudl do ourselves: create taker order
          if (balanceToSell > coin.bestBidMaxVol) { // make sure only the volume available at the best price is traded
            balanceToSell = coin.bestBidMaxVol
          }
          const url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"sell\\",\\"base\\":\\"${coin.name}\\",\\"rel\\":\\"KMD\\",\\"volume\\":\\"${balanceToSell}\\",\\"price\\":\\"${coin.bestBidPrice}\\"}"`
          const command = `curl --url ` + url
          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.log(error.stack);
              console.log('Error code: '+error.code);
              console.log('Signal received: '+error.signal);
            }
            ltf.log('placed order: '+stdout);
          })
        } else { // create maker order at out set price
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
      }
    })
  }, 5000) // allow some time for getting all required data up to date
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
    updateBalance(coin)
    setTimeout(() => {
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
            ltf.log('Sent acquired KMD to distributor address, result: '+stdout);
          })
        })
      }
    }, 5000) // allow some time for getting KMD balance to get up to date
  }
}
