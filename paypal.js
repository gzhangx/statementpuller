const creds = require('./creds.json');
const fs = require('fs');
const submit = require('./lib/submit');
//const https = require('https');
const processor = require('./processors/puppaypal');
async function test(creds) {    
    const trans = await processor.process(creds);
    fs.writeFileSync('outputData/paypal.json', JSON.stringify(trans));
    await submit.submit(trans);
}

test(creds.paypal).catch(err => {
    console.log(err);
});