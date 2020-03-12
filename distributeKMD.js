var request = require('request');
const json = require('json-simple');
const { exec } = require('child_process');
const ltf = require('./logToFile')

// Config
var sendFunds = true; // when true funds are sent, otherwise the RawTransactionString isn't sent to the network
const minCCLlevel = 10; // all addresses with a balance below this value will be disregarded
const transActFee = 0.0001; // in KMD
const minimumPayout = 0.0001; // payouts below this level are ignored
const satoshisPerKMD = 100000000;
const kmdAddress = process.env.KMD_DIST_ADDR; //address to rain from
//const richListDepth = 150; //number of addresses to fetch, balance ordered descending
const requestKMD = exec; // default setting runs the program as if on KMD full node
const requestStringKMDbalance = `~/komodo/src/komodo-cli getaddressbalance '{"addresses": ["${kmdAddress}"]}'`;
const requestStringKMDunspent = `~/komodo/src/komodo-cli listunspent 0 99999999  '["${kmdAddress}"]'`;
var requestCCL = exec; // default setting runs the program as if on CCL full node
var requestStringCCL = `~/komodo/src/komodo-cli -ac_name=CCL getsnapshot` // ${richListDepth}`;
var swapVarCCL = true;

const distribute = () => {
//module.exports = function () {
  ltf.log('KMD distrubution started at: ' + new Date())
  // Check if sending address has a balance > 0
  requestKMD(requestStringKMDbalance, (error, body, response) => {
    if (error) {
      console.log(`KMDserver error: ${error}`);
      return;
    }
    // Get KMD balance in KMD instead of satoshi
    const kmdBalance = json.decode(body).balance/satoshisPerKMD;
    ltf.log('balance: ' + kmdBalance);

    // Get CCL rich list
    requestCCL(requestStringCCL, (error, response, body) => {
      if (error) {
        console.log(`CCLserver error: ${error}`);
        return;
      }
      const richList = json.decode(response).addresses;
      // Show message if result is truncated
      if (richList[richList.length-1].amount >= minCCLlevel) {
        throw (`Possibly not all addresses with balance > minCCLlevel included in richList. Adapt richListDepth to continue! Current depth: ${richListDepth}`);
      }
      // Count balance sum of addresses having > minCCLlevel
      var addrPos = 0; // Keeps track of number of addresses to rain on
      var sumOfBalances = 0; // Keeps track of the total balance of qualifying addresses
      // Stop checking addresses if amount becomes below minCCLlevel
      while ((addrPos < richList.length) && (richList[addrPos].amount >= minCCLlevel)) {
        sumOfBalances += parseFloat(richList[addrPos].amount);
        addrPos++;
      }
      // Get addresses to rain on
      var addressesToRainOn = richList.slice(0, addrPos);
      // Reserve some funds for tx fees
      const amountToRain = kmdBalance - (addrPos*transActFee);
      // Show message if no funds are available to rain
      if (amountToRain <= 0) {
        ltf.log(`Insufficient balance to rain`);
        return
      }
      // Add amounts to rain to addressesToRainOn object
      addressesToRainOn.forEach(function(item) {
        amountToReceive = Math.floor(parseFloat(item.amount)/sumOfBalances*amountToRain * satoshisPerKMD); // in satoshis
        item.rain = amountToReceive;
      });
      // Start creating the actual transactions
      // Create an array of utxos to spend
      var utxoBalance = 0 // Keeps track of the total balance available in the found UTXOs
      requestKMD(requestStringKMDunspent, (error, body, response) => {
        if (error) {
          console.log(`KMDserver error: ${error}`);
          return;
        }
        const utxos = json.decode(body)
        var transActUtxos = [];
        utxos.forEach((item, index) => {
          utxoBalance += utxos[index].amount
          transActUtxos.push({
            "txid": utxos[index].txid,
            "vout": utxos[index].vout
          });
        });
        ltf.log(`Transaction UTXOs: ${JSON.stringify(transActUtxos)}`);

        // create array of rain transactions
        var rainTransactions = {};
        addressesToRainOn.forEach(function(item) {
          if (item.rain/satoshisPerKMD >= minimumPayout) {
            rainTransactions[item.addr.toString()] = item.rain/satoshisPerKMD;
          }
        });
        const rawTransactionString = `~/komodo/src/komodo-cli createrawtransaction '${JSON.stringify(transActUtxos)}' '${JSON.stringify(rainTransactions)}'`;
        ltf.log(`rawTransactionString: ${rawTransactionString}`);
        requestKMD(rawTransactionString, (error, body, response) => {
          if (error) {
            console.log(`KMDserver error: ${error}`);
            return;
          }
          const rawHexString = body;
          ltf.log(`rawHexString: ${rawHexString}`)
          // Sign transaction
          const signString = `~/komodo/src/komodo-cli signrawtransaction ${rawHexString}`;
          requestKMD(signString, (error, body, response) => {
            if (error) {
              console.log(`KMDserver error: ${error}`);
              return;
            }
            ltf.log.log(`Transaction object: ${body}`);
            body=json.decode(body);
            const transactionString = body.hex;
            const succes = body.complete;
            if (succes && sendFunds) {
              // Send the transaction to the network
              const sendTransactionString = `~/komodo/src/komodo-cli sendrawtransaction ${transactionString}`;
              requestKMD(sendTransactionString, (error, body, response) => {
                if (error) {
                  console.log(`KMDserver error: ${error}`);
                  return;
                }
                const transactionHash = body;
                ltf.log(`transactionHash: ${transactionHash}`);
              })
            } else if (succes) {
              console.log(`A successful rawtransaction was created, but not sent to the network.\n`);
              console.log(`Run with parameters "production" and "realmoney" to rain the funds.`);
            } else {
              console.log(`An unsuccesful rawtransaction was created. It didn't rain today...`);
            }
          });
        });
      });
    });
  });
}

module.exports.distribute = distribute
