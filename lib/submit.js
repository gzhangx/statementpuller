const request = require('superagent');
const Promise = require('bluebird');
const fs = require('fs');
async function submit(datas, host) {
    const allRes = await Promise.map(datas, async data => {
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
            return res.body;
        });
    }, {concurrency: 5});
    const imported = allRes.filter(r => r.imported);
    console.log(`imported=${imported.length}, all itemps ${allRes.length} `);
}


//submit(JSON.parse(fs.readFileSync('./outputData/paypal.json')));

module.exports = {
    submit,
}