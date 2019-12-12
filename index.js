const { exec } = require('child_process');
const http = require('http');
const json = require('json-simple');

const minCCLlevel = 10; // all addresses with a balance below this value will be disregarded
const transActCost = 10000; // KMD transaction costs in satoshis
const onKMDnode = false; // set to true if this program runs on a node that also runs the KMD daemon
var richList

const KMDbalanceParams = {
  url:'78.47.111.191',
  address: "RVKn8Fic9aFMzRBWAiJTD7mCHdWxL7aMa1"
}

const CCLrichlistParams = {
  url:"88.198.156.129",
  depth: 150
}

var sourceBalanceKMD = 0;
if (onKMDnode) {
  sourceBalanceKMD = 10; // to be implemented
} else {
  const url1 = `http://${KMDbalanceParams.url}:3000/getaddressbalance%20'%7B%22addresses%22:%20[%22${KMDbalanceParams.address}%22]%7D'`;
  http.get(url1, (res) => {
    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });
    res.on("end", () => {
      sourceBalanceKMD = 0.00000001*json.decode(body).balance;
      console.log(`The KMD balance is ${sourceBalanceKMD}`);
    });
  });
}

const url2 = `http://${CCLrichlistParams.url}:3000/-ac_name=CCL%20getsnapshot%20${CCLrichlistParams.depth}`;
http.get(url2, (res) => {
  let body = "";
  res.on("data", (chunk) => {
    body += chunk;
  });

  res.on("end", () => {
    richList = json.decode(body).addresses;
    console.log(richList);
    if (richList[richList.length-1].amount >= parseFloat(minCCLlevel)) {
      throw (`Possibly not all addresses with balance > minCCLlevel included in richList. Adapt minCCLlevel to continue!`);
    }
  });
});
