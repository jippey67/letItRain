var fs = require('fs');
var src = fs.readFileSync('./allToKMD/ourCoins')

const userpass = ''
const ourCoins = JSON.parse(src)

var url;
var command;

var coin = ourCoins[4]




// connect coin
url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"electrum\\",\\"coin\\":\\"${coin.name}\\",\\"servers\\":[`
coin.electrums.forEach((electrum) => {
  url += `{\\"url\\":\\"${electrum}\\"},`
})
url = url.slice(0, -1);
url += `]}"`
command = `curl --url ` + url
console.log(command)








//get balance

//curl --url "http://127.0.0.1:7783" --data "{\"userpass\":\"$userpass\",\"method\":\"my_balance\",\"coin\":\"$1\"}"
url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"my_balance\\",\\"coin\\":\\"${coin.name}\\"}"`
command = `curl --url ` + url
console.log(command)

// place an order
coin.balance = 2.5
const balanceToSell = 0.99 * coin.balance // keep 1% for fees
coin.lastQuote = 123.654
const priceToOffer = 0.95 * coin.lastQuote // offer an attractive price such that trade will follow through with high probability

//curl --url "http://127.0.0.1:7783" --data "{\"userpass\":\"$userpass\",\"method\":\"setprice\",\"base\":\"$1\",\"rel\":\"$2\",\"price\":\"$3\",\"volume\":\"$4\"}"
url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"setprice\\",\\"base\\":\\"${coin.name}\\",\\"rel\\":\\"KMD\\",\\"price\\":\\"${priceToOffer}\\",\\"volume\\":\\"${balanceToSell}\\"}"`
command = `curl --url ` + url
console.log(command)




// send KMD to distributor address
ourCoins[3].balance = 312.8766
var kmdBalance
ourCoins.forEach((coin) => {
  if (coin.name === 'KMD') {
    kmdBalance = coin.balance
  }
})

url = `"http://127.0.0.1:7783" --data "{\\"method\\":\\"withdraw\\",\\"coin\\":\\"KMD\\",\\"to\\":\\"RXEbBErWKAKvAbtdBvk9PivvHMejwstJbF\\",\\"amount\\":\\"${kmdBalance}\\",\\"userpass\\":\\"$userpass\\"}"`
command = `curl --url ` + url
console.log(command)
//receives an object with "tx_hex"
var txHex = '0400008085202f8901c25ecb12f5fc17120bf92ed18ff71754b5f58e6eece2fba44fc114f14176df04010000006a4730440220732047807944afcb062f5dc7af87fe5b9979e447cd235ef1b130e50008c3d51a02201b232814bcee9c0b5a29aa24d453e493cd121a0e21d94c0e84476de0a15e74a101210217a6aa6c0fe017f9e469c3c00de5b3aa164ca410e632d1c04169fd7040e20e06ffffffff02401ac805000000001976a914d020156e7d0fead249cfb5a458952ae941ac9f9e88ac5800fb0b000000001976a9144726f2838fc4d6ac66615e10604e18926e9b556e88ac06a5355d000000000000000000000000000000'
url = `"http://127.0.0.1:7783" --data "{\\"method\\":\\"send_raw_transaction\\",\\"coin\\":\\"KMD\\",\\"tx_hex\\":\\"${txHex}\\",\\"userpass\\":\\"${userpass}\\"}"`
command = `curl --url ` + url
console.log(command)



//view myOrders
url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"my_orders\\"}"`
command = `curl --url ` + url
console.log(command)

//receives an object with among otjer maker orders if it is just one, it seems to be an object not an array. uuid is id of order
//cancel an order
var uuid = '6621efd5-72dd-422c-89a8-7b655b744ead'
url = `"http://127.0.0.1:7783" --data "{\\"userpass\\":\\"${userpass}\\",\\"method\\":\\"cancel_order\\",\\"uuid\\":\\"${uuid}\\"}"`
command = `curl --url ` + url
console.log(command)
