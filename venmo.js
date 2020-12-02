const creds = require('./creds.json');
const moment = require('moment');
const fs = require('fs');
//const https = require('https');
const submit = require('./lib/submit');
const processor = require('./processors/puppvenmo');
processor.process(creds.venmo).then(async trans => {
    fs.writeFileSync('outputData/venmo.json', JSON.stringify(trans, null, 2));
    await submit.submit(trans);
    console.log('done');
}).catch(err => {
    console.log(err);
    driver.quit();
});