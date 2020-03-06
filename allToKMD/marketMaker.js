
const { exec } = require('child_process');
const userpass = process.env.USERPASS

const child = (command) => {
  const childProc = exec(command, function (error, stdout, stderr) {
    if (error) {
      console.log(error.stack);
      console.log('Error code: '+error.code);
      console.log('Signal received: '+error.signal);
    }
    console.log('Child Process STDOUT: '+stdout);
    //console.log('Child Process STDERR: '+stderr);
    return stdout
  });

  // childProc.on('exit', function (code) {
  //   console.log('Child process exited with exit code '+code);
  // });
}

// connect coin
module.exports.connectCoin = (coin) => {
  var url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"electrum\\",\\"coin\\":\\"${coin.name}\\",\\"servers\\":[`
  coin.electrums.forEach((electrum) => {
    url += `{\\"url\\":\\"${electrum}\\"},`
  })
  url = url.slice(0, -1);
  url += `]}"`
  const command = `curl --url ` + url
  // console.log(command)
  const childRes = child(command)
  console.log (childRes)
  return childRes
}



//get balance
module.exports.getBalance = (coin) => {
  const url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"my_balance\\",\\"coin\\":\\"${coin.name}\\"}"`
  const command = `curl --url ` + url
  const returnValue = exec(command, function (error, stdout, stderr) {
    if (error) {
      console.log(error.stack);
      console.log('Error code: '+error.code);
      console.log('Signal received: '+error.signal);
    }
    console.log('Child Process STDOUT: '+JSON.parse(stdout).balance);
    coin.balance = JSON.parse(stdout).balance
    console.log(coin)
    //console.log('Child Process STDERR: '+stderr);
  })
  //console.log(returnValue)

}


module.exports.placeOrder = (coin, kmdCoin) => {
  // !!!!!!!!!!! make sure amount is larger than 1 usd !!!!!!!!!!!!!
  const balanceToSell = 0.99 * coin.balance // keep 1% for fees
  const priceToOffer = 0.95 * coin.price_usd/kmdCoin.price_usd // offer an attractive price such that trade will follow through with high probability
  const url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"setprice\\",\\"base\\":\\"${coin.name}\\",\\"rel\\":\\"KMD\\",\\"price\\":\\"${priceToOffer}\\",\\"volume\\":\\"${balanceToSell}\\"}"`
  const command = `curl --url ` + url
  console.log(command)
}


module.exports.viewOrders = () => {
  const url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"my_orders\\"}"`
  const command = `curl --url ` + url
  exec(command, function (error, stdout, stderr) {
    if (error) {
      console.log(error.stack);
      console.log('Error code: '+error.code);
      console.log('Signal received: '+error.signal);
    }
    console.log('Open orders: '+stdout);
    var uuid = '6621efd5-72dd-422c-89a8-7b655b744ead'
    const url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"cancel_order\\",\\"uuid\\":\\"${uuid}\\"}"`
    const command = `curl --url ` + url
    console.log(command)

  })
}

module.exports.sendKMDtoDistributor = (coin) => {
  var kmdBalance = 0
  if (coin.name == 'KMD') {
    kmdBalance = coin.balance - 0.001 // subtract transaction fee
    console.log(coin.balance)
    const url = `"http://127.0.0.1:7783" --data "{\\"method\\":\\"withdraw\\",\\"coin\\":\\"KMD\\",\\"to\\":\\"RXEbBErWKAKvAbtdBvk9PivvHMejwstJbF\\",\\"amount\\":\\"${kmdBalance}\\",\\"userpass\\":\\"${userpass}\\"}"`
    const command = `curl --url ` + url
    console.log(command)
    exec(command, function (error, stdout, stderr) {
      if (error) {
        console.log(error.stack);
        console.log('Error code: '+error.code);
        console.log('Signal received: '+error.signal);
      }
      const txHex = JSON.parse(stdout).tx_hex
      console.log('transaction: '+ txHex);
      const url = `"http://127.0.0.1:7783" --data "{\\"method\\":\\"send_raw_transaction\\",\\"coin\\":\\"KMD\\",\\"tx_hex\\":\\"${txHex}\\",\\"userpass\\":\\"${userpass}\\"}"`
      const command = `curl --url ` + url
      console.log(command)
    })

  }
}
