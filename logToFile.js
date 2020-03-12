const fs = require('fs')

// this function adds each 'regel' to the daily logfile of the form ./logs/yyyy-mm-dd.log
module.exports.log = (regel) => {
  var now = new Date;
  let date = ("0" + now.getUTCDate()).slice(-2);
  let month = ("0" + (now.getUTCMonth() + 1)).slice(-2);
  let year = now.getUTCFullYear();
  let hours = now.getUTCHours();
  let minutes = now.getUTCMinutes();
  let seconds = now.getUTCSeconds();

  const filename = "./logs/" + year + "-" + month + "-" + date +'.log'
  fs.appendFile(filename, hours + ":" + minutes + ":" + seconds + ' ' + regel+'\n', function (err) {
    if (err) throw err;
  });
}
