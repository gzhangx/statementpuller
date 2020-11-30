const creds = require('./creds.json');
const moment = require('moment');
const Promise = require('bluebird');
const fs = require('fs');
const submit = require('./lib/submit');
//const https = require('https');
const { sleep, waitElement    
} = require('./lib/util');

const { createPuppeteer } = require('./lib/chromPupp');
const envCfg = require('./lib/env');
async function test(creds) {
    const pupp = await createPuppeteer(envCfg.getCfg());
    const saveScreenshoot = () => pupp.screenshot('outputData/test.png');
    await pupp.goto("https://www.paypal.com/us/signin");

    let setEmail = false;
    await waitElement({
        message: 'Waiting page startup',
        //const readyState = await driver.executeScript("return document.readyState");        
        action: async () => {
            await saveScreenshoot();
            if (!setEmail) {
                await pupp.setTextById('email', creds.userName);
                setEmail = true;
            }
            try {
                const next = await pupp.findById('btnNext');
                await next.click();
                await sleep(1000);
            } catch { }
            try {
                await pupp.setTextById('password',creds.password);
            } catch {
                
            }
            const btn = await pupp.findById('btnLogin');
            await btn.click();
        }
    });    
    

    await waitElement({
        message: 'Recapture',
        waitSeconds: 60,
        action: async () => {
            await sleep(1000);
            await saveScreenshoot();
            try {
                const recap = await pupp.findById('recaptcha-anchor');
                console.log('found recapture');
                await recap.click();
                console.log('clicking recapture');
                await sleep(1000);
            } catch (e) {
                console.log(e.message);
            }
            await saveScreenshoot();
            const curr = await pupp.findByCSS('.test_balance-tile-currency');
            if (!curr) throw {message:'not login'}
        }
    });

    await sleep(1000);
    const btnActivities = await pupp.findById('header-activity');
    await btnActivities.click();
    await waitElement({
        message: 'Wait transction page',
        waitSeconds: 60,
        action: async () => {
            await sleep(1000);
            await saveScreenshoot();
            const found = await pupp.findByCSS('.transactionDescriptionContainer');
            if (!found) throw {message:'no desc'}
        }
    });
    await saveScreenshoot();

    const containers = await pupp.findAllByCss('.transactionDescriptionContainer');
    console.log(`containers=${containers.length}`);

    const paypalTrans = await Promise.map(containers, async cont => {
        /*
        const desc = await cont.findElements(By.css('.transactionDescription'));
        while (true) {
            try {
                const line = await readOneLine('give me a line');
                console.log(line);
                const divs = await cont.findElements(By.css(line));
                await Promise.map(divs, async (div,ind) => {
                    const value = await div.getAttribute('innerHTML');
                    console.log(ind + ' val=' + value);
                }, { concurrency: 1 });                
                
            } catch (e) {
                console.log(e.message)
            }
        }
*/
        const getInnerHtml = c=>c.getAttribute('innerHTML');
        const getByCss = c => getInnerHtml(cont.findElement(By.css(c)));
        const name = await pupp.getElementText(cont, '.counterparty-text');
        const amountSignData = await cont.$$('.transactionAmount span');
        const sign = await pupp.getElementText(amountSignData[0]);
        const amount = await pupp.getElementText(amountSignData[sign==='-'?2:1]);

        const MMMDD = await pupp.getElementText(cont, '.relative-time');
        let notes = '';
        try {
            notes = await pupp.getElementText(cont,'.notes-text');
        } catch { }
        const transactionType = await pupp.getElementText(cont,'.transactionType');
        const parsedDate = moment(MMMDD, 'MMM D');
        if (parsedDate.isAfter(moment())) {
            parsedDate.add(-11, 'years');            
        }
        const time = parsedDate.toDate();
        const formatted = parsedDate.format('YYYY-MM-DD');
        console.log(`${transactionType} ${sign} ${amount} name=${name} notes=${notes} ${formatted}`);
        return {
            transactionType,
            sign,
            amount: sign + amount.replace(/[$]/, '').trim().replace(/,/g,''),
            name,
            notes,
            date: formatted,
            source: 'paypal',
        }
    },{concurrency:1});

    await pupp.close();
    console.log('all done');
    console.log(paypalTrans);
    fs.writeFileSync('./outputData/paypal.json', JSON.stringify(paypalTrans));
    await submit.submit(paypalTrans);
}

test(creds.paypal).catch(err => {
    console.log(err);
});