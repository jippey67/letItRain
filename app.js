var request = require('request');
const json = require('json-simple');
const { exec } = require('child_process');

// Config
const minCCLlevel = 10000000; // all addresses with a balance below this value will be disregarded
const transActFee = 0.00010000; // in KMD
const kmdAddress = 'RXEbBErWKAKvAbtdBvk9PivvHMejwstJbF'; //address to rain from
const richListDepth = 150; //number of addresses to fetch, balance ordered descending
var requestKMD = request; // default setting runs the program as if NOT on KMD full node
var requestStringKMD = `http://78.47.111.191:3000/balance/${kmdAddress}`;
var swapVarKMD = false;
var requestCCL = request; // default setting runs the program as if NOT on CCL full node
var requestStringCCL = `http://88.198.156.129:3000/richlist/${richListDepth}`;
var swapVarCCL = false;

if (process.argv[2]) {
  const arguments = process.argv.slice(2);
  arguments.forEach((item, index) => {
    if (item == 'onKMD') { // Get KMD balance through cli command when on KMD node
      requestKMD = exec;
      requestStringKMD = `~/komodo/src/komodo-cli getaddressbalance '{"addresses": ["${kmdAddress}"]}'`;
      swapVarKMD = true;
    }
    if (item == 'onCCL') { // Get CCL rich list through cli command when on CCL node
      requestCCL = exec;
      requestStringCCL = `~/komodo/src/komodo-cli -ac_name=CCL getsnapshot ${depth}`;
      swapVarCCL = true;
    }
  });
}
console.log(requestStringKMD);
// Check if sending address has a balance > 0
requestKMD(requestStringKMD, (error, response, body) => {
  if (error) {
    console.log(`KMDserver error: ${error}`);
    return;
  }
  if (swapVarKMD) {
    body = response;
  }
  // Get KMD balance in KMD instead of satoshi
  const KMDbalance = 0.00000001 * json.decode(body).balance
  console.log('balance:', KMDbalance);

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
    var addrPos = 0;
    var sumOfBalances = 0;
    // Count balance sum of addresses having > minCCLlevel
    // Stop checking addresses if amount becomes below minCCLlevel
    while ((addrPos < richList.length) && (richList[addrPos].amount >= minCCLlevel)) {
      sumOfBalances += parseFloat(richList[addrPos].amount);
      addrPos++;
    }
    console.log('sumOfBalances', sumOfBalances)
    // Get addresses to rain on
    const addressesToRainOn = richList.slice(0, addrPos);
    // Reserve some funds for tx fees
    const amountToRain = KMDbalance - (addrPos*transActFee);
    // Show message if no funds available to rain
    if (amountToRain <= 0) {
      throw (`Balance - transaction fees doesn't leave funds to rain`);
    }
    addressesToRainOn.forEach(function(item) {
      amountToReceive = Math.floor(parseFloat(item.amount)/sumOfBalances*amountToRain * 100000000); // in satoshis
      item.rain = amountToReceive;
    });
    for (var i=0; i <= addressesToRainOn.length-1; i++) {
      console.log(`Send ${addressesToRainOn[i].rain} KMD satoshis to ${addressesToRainOn[i].addr} with a balance of ${addressesToRainOn[i].amount} CCL`);
    }
    // DEVELOPMENT SPACE *************************

    var testObject = [{
      addr: 'RVKn8Fic9aFMzRBWAiJTD7mCHdWxL7aMa1', //Jeroen CCLwallet
      amount: 'ookTest.00000000',
      segid: 49,
      rain: 500000
    }];
    testObject.push({
      addr: 'RXEbBErWKAKvAbtdBvk9PivvHMejwstJbF', //KMDnode wallet
      amount: 'test.00000000',
      segid: 49,
      rain: 400000
    });
    for (var i=0; i <= testObject.length-1; i++) {
      console.log(`Send ${testObject[i].rain} KMD satoshis to ${testObject[i].addr} with a balance of ${testObject[i].amount} CCL`);
    };

    requestStringKMD = `~/komodo/src/komodo-cli listunspent 0 99999999  '["${kmdAddress}"]'`;
    requestKMD(requestStringKMD, (error, response, body) => {
      if (error) {
        console.log(`KMDserver error: ${error}`);
        return;
      }
      if (swapVarKMD) {
        body = response;
      }
      console.log(body);
      const utxos = json.decode(body)
      console.log(utxos[0]);
      console.log(utxos.length);
      /*
      var transActUtxos = [];
      utxos.forEach((item, index) => {
        transActUtxos.push({
          "txid": utxos[index].txid,
          "vout": index
        });
      });
      console.log(transActUtxos);
      */
    });


    //






  });
});
