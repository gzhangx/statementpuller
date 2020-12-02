const request = require('superagent');
const Promise = require('bluebird');
const fs = require('fs');
const sheet = require('./getSheet').createSheet();
const sheetId = '1xFCW8QsdfWRMjzXcUcXwe4HIfWNShgkrHE7UbKGgwLc';
async function submit(datas, host) {
    let cur = 0;
    await sheet.appendSheet(sheetId, `'Sheet1'!A1`, datas.map(data=>[data.date, data.amount, data.name, data.notes, data.source]));
    const allRes = await Promise.map(datas, async data => {
        const me = cur++;
        console.log(`processing ${me}/${datas.length}`);        
        return await request.post(`http://${host ||'192.168.1.41:8081'}/sql/importPayment`).send(
            {
                date: data.date,
                amount: data.amount,
                name: data.name,
                notes: data.notes,
                source: data.source,
            }
        ).then(res => {
            console.log(res.body);            
            console.log(`done ${me}/${datas.length}`);
            return res.body;
        });
    }, { concurrency: 5 });    
    const imported = allRes.filter(r => r.imported);
    console.log(`imported=${imported.length}, all itemps ${allRes.length} `);
}


//submit(JSON.parse(fs.readFileSync('./outputData/paypal.json')));

module.exports = {
    submit,
}