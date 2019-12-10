const { exec } = require('child_process');
const http = require('http');
const getKMDdata = require('./getKMDdata');

const minCCLlevel = 10; // all addresses with a balance below this value will be disregarded
const transActCost = 10000; // satoshis
const onKMDnode = false;

sourceBalanceKMD = 0;
if (onKMDnode) {
  sourceBalanceKMD = 10; // to be implemented
} else {
  let url = "http://78.47.111.191:3000/getaddressbalance%20'%7B%22addresses%22:%20[%22RVKn8Fic9aFMzRBWAiJTD7mCHdWxL7aMa1%22]%7D'";
  http.get(url, (res) => {
    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });
    res.on("end", () => {
      sourceBalanceKMD = getKMDdata.parse(body)
      console.log(`The KMD balance is ${sourceBalanceKMD.balance}`);
    });
  });
}



let url2 = "http://88.198.156.129:3000/getsnapshot%203";
http.get(url2, (res) => {
  let body = "";
  res.on("data", (chunk) => {
    body += chunk;
  });

  res.on("end", () => {
    console.log(body);
    let richList = getKMDdata.parse(body).addresses;
    console.log(richList);
    console.log(richList[1].amount);
  });
});
