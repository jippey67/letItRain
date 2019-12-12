const express = require('express')
const app = express()
const port = 3000
const { exec } = require('child_process');

app.get('/richlist/:depth', (req, res) => {
  var depth = req.params.depth;
  var query = "~/komodo/src/komodo-cli%20-ac_name=CCL%20getsnapshot%20"+depth;
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
  var query = `~/komodo/src/komodo-cli%20getaddressbalance%20'%7B%22addresses%22:%20[%22${kmdAddress}%22]%7D'`;
  console.log(query);
  exec((query), (err, stdout, stderr) => {
    if(err) {
      return;
    }
    res.send(stdout)
  })
})

app.listen(port, () => console.log(`app listening on port ${port}`))
