const { exec } = require('child_process');
const http = require('http');
const json = require('json-simple');

const chains = {
  "KMD": "",
  "CCL": "-ac_name=CCL"
};

const obtainData = (ip, chain, request) => {
  var url = `http://${ip}:3000/${chains[chain]} ${request}`;
  http.get(url, (res) => {
    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });
    res.on("end", () => {
      console.log(body);
      return body;
    });
  });
}

exports.obtainData = obtainData;
