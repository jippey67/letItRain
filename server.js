const express = require('express')
const app = express()
const port = 3000
const { exec } = require('child_process');

app.get('/richlist/:depth', (req, res) => {
  var depth = req.params.depth;
  var query = `~/komodo/src/komodo-cli -ac_name=CCL getsnapshot ${depth}`;
  console.log(query);
  exec((query), (err, stdout, stderr) => {
    if(err) {
      return;
    }
    res.send(stdout)
  })
})

app.get('/balance/:address', (req, res) => {
  var kmdAddress = req.params.address;
  var query = `~/komodo/src/komodo-cli getaddressbalance '{"addresses": ["${kmdAddress}"]}'`;
  console.log(query);
  exec((query), (err, stdout, stderr) => {
    if(err) {
      return;
    }
    res.send(stdout)
  })
})

app.listen(port, () => console.log(`app listening on port ${port}`))
