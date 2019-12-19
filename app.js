var request = require('request');
const json = require('json-simple');
const { exec } = require('child_process');

// Config
var inDemoMode = true;
var sendFunds = false;
const minCCLlevel = 10; // all addresses with a balance below this value will be disregarded
const transActFee = 0.00010000; // in KMD
const satoshisPerKMD = 100000000;
const kmdAddress = 'RXEbBErWKAKvAbtdBvk9PivvHMejwstJbF'; //address to rain from
const richListDepth = 150; //number of addresses to fetch, balance ordered descending
const requestKMD = exec; // default setting runs the program as if NOT on KMD full node
const requestStringKMDbalance = `~/komodo/src/komodo-cli getaddressbalance '{"addresses": ["${kmdAddress}"]}'`;
const requestStringKMDunspent = `~/komodo/src/komodo-cli listunspent 0 99999999  '["${kmdAddress}"]'`;
var requestCCL = request; // default setting runs the program as if NOT on CCL full node
var requestStringCCL = `http://88.198.156.129:3000/richlist/${richListDepth}`;
var swapVarCCL = false;

// handle parameters
if (process.argv[2]) {
  const arguments = process.argv.slice(2);
  arguments.forEach((item, index) => {
    if (item == 'onCCL') { // Get CCL rich list through cli command when on CCL node
      requestCCL = exec;
      requestStringCCL = `~/komodo/src/komodo-cli -ac_name=CCL getsnapshot ${depth}`;
      swapVarCCL = true;
    }
    if (item == 'production') { // set it to rain real money.
      inDemoMode = false;
    }
    if (item == 'realmoney') { // set it to rain real money.
      sendFunds = true;
    }
  });
}

// Check if sending address has a balance > 0
requestKMD(requestStringKMDbalance, (error, body, response) => {
  if (error) {
    console.log(`KMDserver error: ${error}`);
    return;
  }
  // Get KMD balance in KMD instead of satoshi
  const kmdBalance = json.decode(body).balance/satoshisPerKMD;
  console.log('balance:', kmdBalance);

  // Get CCL rich list
  requestCCL(requestStringCCL, (error, response, body) => {
    if (error) {
      console.log(`CCLserver error: ${error}`);
      return;
    }
    if (swapVarCCL) {
      body = response;
    }
    const richList = json.decode(body).addresses;
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
      throw (`Balance - transaction fees doesn't leave funds to rain`);
    }
    // Add amounts to rain to addressesToRainOn object
    addressesToRainOn.forEach(function(item) {
      amountToReceive = Math.floor(parseFloat(item.amount)/sumOfBalances*amountToRain * satoshisPerKMD); // in satoshis
      item.rain = amountToReceive;
    });
    for (var i=0; i <= addressesToRainOn.length-1; i++) {
      console.log(`Send ${addressesToRainOn[i].rain} KMD satoshis to ${addressesToRainOn[i].addr} with a balance of ${addressesToRainOn[i].amount} CCL`);
    }
    // Start creating the actual transactions
    // Create an array of utxos to spend
    var utxoBalance = 0
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
      console.log(`Transaction UTXOs: ${JSON.stringify(transActUtxos)}`);
      // Declaration of some variables used for test/demo purposes
      var totaalTestAmount = 0;
      var wisselgeld;
      // Create demo mode testObject to replace addressesToRainOn
      if (inDemoMode) {
        var testObject = [{
          addr: 'RVKn8Fic9aFMzRBWAiJTD7mCHdWxL7aMa1', //Jeroen CCLwallet
          amount: 'ookTest.00000000',
          segid: 49,
          rain: 500000
        }];
        testObject.push({
          addr: 'RFJwnz7hPtUPvFpWi9ziDUyfdSga8VmfoA', //Jeroen AgamaVerus wallet
          amount: 'test.00000000',
          segid: 49,
          rain: 400000
        });
        for (var i=0; i <= testObject.length-1; i++) {
          console.log(`Send ${testObject[i].rain} KMD satoshis to ${testObject[i].addr} with a balance of ${testObject[i].amount} CCL`);
          totaalTestAmount += testObject[i].rain/satoshisPerKMD
        };
        wisselgeld = Math.floor(satoshisPerKMD * (utxoBalance - totaalTestAmount - 0.0003))/satoshisPerKMD;
        console.log(`wisselgeld: ${wisselgeld}`);
        addressesToRainOn = testObject;
      }

      // create array of rain transactions
      var rainTransactions = {};
      addressesToRainOn.forEach(function(item) {
        rainTransactions[item.addr.toString()] = item.rain/satoshisPerKMD;
      });
      if (inDemoMode) { // Returns change to orginal address
        rainTransactions[kmdAddress] = wisselgeld;
      }

      console.log(`Rainstransactions: ${JSON.stringify(rainTransactions)}`);

      // Create RawTransactionString
      const rawTransactionString = `~/komodo/src/komodo-cli createrawtransaction '${JSON.stringify(transActUtxos)}' '${JSON.stringify(rainTransactions)}'`;
      console.log(`rawTransactionString: ${rawTransactionString}`);
      requestKMD(rawTransactionString, (error, body, response) => {
        if (error) {
          console.log(`KMDserver error: ${error}`);
          return;
        }
        const rawHexString = body;
        console.log(`rawHexString: ${rawHexString}`)
        // Sign transaction
        const signString = `~/komodo/src/komodo-cli signrawtransaction ${rawHexString}`;
        requestKMD(signString, (error, body, response) => {
          if (error) {
            console.log(`KMDserver error: ${error}`);
            return;
          }
          console.log(`Transaction object: ${body}`);
          body=json.decode(body);
          const transactionString = body.hex;
          const succes = body.complete;
          if (succes && (inDemoMode || sendFunds)) {
            // Send the transaction to the network
            const sendTransactionString = `~/komodo/src/komodo-cli sendrawtransaction ${transactionString}`;
            requestKMD(sendTransactionString, (error, body, response) => {
              if (error) {
                console.log(`KMDserver error: ${error}`);
                return;
              }
              const transactionHash = body;
              console.log(`transactionHash: ${transactionHash}`);
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
