var request = require('request')

const chains = {
  "KMD": "",
  "CCL": "-ac_name=CCL"
};

const obtainData = (ip, chain, request, callback) => {
    //const url = `http://${ip}:3000/${chains[chain]} ${request}`;
    url = "http://78.47.111.191:3000/getaddressbalance%20'%7B%22addresses%22:%20[%22RVKn8Fic9aFMzRBWAiJTD7mCHdWxL7aMa1%22]%7D'"
    request(url, (error, response, body) => {
        if (error) {
            callback('Unable to connect', undefined)
        } else if (response.body.error) {
            callback('Request results in error from server', undefined)
        } else {
            callback(undefined, response.body)
        }
    });
}

exports.obtainData = obtainData;


/*


request('http://78.47.111.191:3000/getblockchaininfo', function (error, response, body) {
  console.log('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  console.log('body:', body); // Print the HTML for the Google homepage.
});
*/
