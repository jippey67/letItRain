var request = require('request');
const json = require('json-simple');

const transActFee = 0.00010000 // in KMD

request("http://78.47.111.191:3000/getaddressbalance%20'%7B%22addresses%22:%20[%22RVKn8Fic9aFMzRBWAiJTD7mCHdWxL7aMa1%22]%7D'", function (error, response, body) {
  //console.log('error:', error); // Print the error if one occurred
  //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  //console.log('body:', body); //
  const KMDbalance = 0.00000001*json.decode(body).balance
  console.log('balance:', KMDbalance);

  request("http://88.198.156.129:3000/-ac_name=CCL%20getsnapshot%20150", function (error, response, body) {
    //console.log('error:', error); // Print the error if one occurred
    //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received

    body = json.decode(body);
    console.log('body:', body); //

    var addrPos = 0;
    var sumOfBalances = 0;

    console.log(body.addresses[0]);
    console.log(body.utxos);
    while (body.addresses[addrPos].amount >= 10) {
      sumOfBalances += parseFloat(body.addresses[addrPos].amount);
      console.log(`row ${addrPos} sumOfBalances: ${sumOfBalances}, ${body.addresses[addrPos].amount} \n`);
      addrPos += 1;
    }
    console.log(addrPos);
    const addressesToRainOn = body.addresses.slice(0, addrPos);
    console.log(addressesToRainOn[addressesToRainOn.length-1]);
    const amountToRain = KMDbalance - (addrPos*transActFee);
    var rainToAddresses = [];
    addressesToRainOn.forEach(function(item) {
      console.log(item, item.amount, sumOfBalances, amountToRain);
      amountToReceive =  Math.floor(parseFloat(item.amount)/sumOfBalances*amountToRain * 100000000); // in satoshis
      rainToAddresses.push(amountToReceive);
    });
    for (var i=0; i <= addressesToRainOn.length-1; i++) {
      console.log(i, addressesToRainOn.length);
      console.log(`Send ${rainToAddresses[i]} KMD satoshis to ${addressesToRainOn[i].addr} with a balance of ${addressesToRainOn[i].amount}`);
    }




  });





});
