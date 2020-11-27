const creds = require('./creds.json');
const moment = require('moment');
const Promise = require('bluebird');
const fs = require('fs');
//const https = require('https');
const { sleep, waitElement, driver, By, saveScreenshoot,
    pmap1,
    getFileWithCookies,
    readOneLine,
    saveCookies,
    loadCookies,
} = require('./lib/util');

async function test(creds) {
    
    await driver.get("https://www.paypal.com/us/signin");
    await loadCookies();

    let setEmail = false;
    await waitElement({
        message: 'Waiting page startup',
        //const readyState = await driver.executeScript("return document.readyState");        
        action: async () => {
            await saveScreenshoot();
            if (!setEmail) {
                await driver.findElement(By.id('email')).sendKeys(creds.userName);
                setEmail = true;
            }
            try {
                const next = await driver.findElement(By.id('btnNext'));
                await next.click();
                await sleep(1000);
            } catch { }
            try {
                await driver.findElement(By.id('password')).sendKeys(creds.password);
            } catch {
                
            }
            const btn = await driver.findElement(By.id('btnLogin'));
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
                const recap = await driver.findElement(By.id('recaptcha-anchor'));
                console.log('found recapture');
                await recap.click();
                console.log('clicking recapture');
                await sleep(1000);
            } catch (e) {
                console.log(e.message);
            }
            await saveScreenshoot();
            await driver.findElement(By.css('.test_balance-tile-currency'));                
        }
    });

    await sleep(1000);
    const btnActivities = await driver.findElement(By.id('header-activity'));
    await btnActivities.click();
    await waitElement({
        message: 'Wait transction page',
        waitSeconds: 60,
        action: async () => {
            await sleep(1000);
            await saveScreenshoot();
            await driver.findElements(By.css('.transactionDescriptionContainer'));
        }
    });
    await saveScreenshoot();
    await saveCookies();
    console.log('cookies saved');


    const containers = await driver.findElements(By.css('.transactionDescriptionContainer'));
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
        const name = await getByCss('.counterparty-text');
        const amountSignData = await cont.findElements(By.css('.transactionAmount span'));
        const sign = await getInnerHtml(amountSignData[0]);
        const amount = await getInnerHtml(amountSignData[sign==='-'?2:1]);

        const MMMDD = await getByCss('.relative-time');
        let notes = '';
        try {
            notes = await getByCss('.notes-text');
        } catch { }
        const transactionType = await getByCss('.transactionType');
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

    await driver.quit();
    console.log('all done');
    console.log(paypalTrans);
    fs.writeFileSync('./outputData/paypal.json', JSON.stringify(paypalTrans));
}

test(creds.paypal).catch(err => {
    console.log(err);
    driver.quit();
});