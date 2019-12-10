const { exec } = require('child_process');
const http = require('http');

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
      console.log(body);
      body2 = body.replace("\\n  \\","");
      console.log(body2);
      str1 = "\\n"
      str2 = "\\"
      str3 = "answer: "
      var newstr = body.split(str1).join("").split(str2).join("").replace(str3,"");
      let f = '"{'
      let g = "{"
      let h = '}"'
      let i = "}"
      var newstr = newstr.replace(f,g).replace(h,i);
      console.log(newstr);

      let t1 = (JSON.parse(newstr));
      console.log(t1.balance);
      console.log(typeof t1);
    });
  });
  sourceBalanceKMD = 0
}

let url2 = "http://88.198.156.129:3000/getsnapshot%203";

http.get(url2, (res) => {
  let body = "";
  res.on("data", (chunk) => {
    body += chunk;
  });

  res.on("end", () => {
    console.log(body);

    str1 = "\\n"
    str2 = "\\"
    str3 = "answer: "
    var newstr = body.split(str1).join("").split(str2).join("").replace(str3,"");
    let f = '"{'
    let g = "{"
    let h = '}"'
    let i = "}"
    var newstr = newstr.replace(f,g).replace(h,i);
    console.log(newstr);

    let t1 = (JSON.parse(newstr));
    console.log(t1.utxos);
  });
});
