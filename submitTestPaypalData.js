const fs = require('fs');
const submit = require('./lib/submit');

submit.submit(JSON.parse(fs.readFileSync('./outputData/paypal.json')));