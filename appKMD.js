var request = require('request');
const json = require('json-simple');
const { exec } = require('child_process');

const minCCLlevel = 10; // all addresses with a balance below this value will be disregarded
const transActFee = 0.00010000 // in KMD
const kmdAddress = 'RVKn8Fic9aFMzRBWAiJTD7mCHdWxL7aMa1' //address to rain from
const richListDepth = 150 //number of addresses to fetch, balance ordered descending

const query = `~/komodo/src/komodo-cli getaddressbalance '{"addresses": ["${kmdAddress}"]}'`;
exec((query), (err, stdout, stderr) => {
  if(err) {
    return;
  }
  console.log(stdout);
  const KMDbalance = 0.00000001*json.decode(stdout).balance
  console.log('balance:', KMDbalance);
  request(`http://88.198.156.129:3000/richlist/${richListDepth}`, function (error, response, body) {
    if (error) {
      console.log(`CCLserver error: ${error}`);
    }
    richList = json.decode(body).addresses;
    if (richList[richList.length-1].amount >= (minCCLlevel)) {
      throw (`Possibly not all addresses with balance > minCCLlevel included in richList. Adapt richListDepth to continue!`);
    }
    var addrPos = 0;
    var sumOfBalances = 0;

    while ((addrPos < richList.length) && (richList[addrPos].amount >= minCCLlevel)) {
      sumOfBalances += parseFloat(richList[addrPos].amount);
      addrPos++;
    }
    const addressesToRainOn = richList.slice(0, addrPos);
    const amountToRain = KMDbalance - (addrPos*transActFee);
    var rainToAddresses = [];
    addressesToRainOn.forEach(function(item) {
      amountToReceive =  Math.floor(parseFloat(item.amount)/sumOfBalances*amountToRain * 100000000); // in satoshis
      rainToAddresses.push(amountToReceive);
    });
    for (var i=0; i <= addressesToRainOn.length-1; i++) {
      console.log(`Send ${rainToAddresses[i]} KMD satoshis to ${addressesToRainOn[i].addr} with a balance of ${addressesToRainOn[i].amount}`);
    }
  });
});
