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
        message: 'close Notification',
        waitSeconds: 60,
        action: async () => {
            await sleep(1000);
            await saveScreenshoot();
            try {
                const recap = await driver.findElement(By.id('recaptcha-anchor'));
                recap.click();
                console.log('clicking recapture');
                await sleep(1000);
            } catch { }
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

    await Promise.map(containers, async cont => {
        const all = await cont.findElements(By.css('>*'));
        const desc = await cont.findElements(By.css('transactionDescription'));
        const div = await cont.findElements(By.css('div'));
        const divspan = await cont.findElements(By.css('div span'));
        console.log(`${all.length }desc=${desc.length} div=${div.length} ${divspan.length}`);
    },{concurrency:1});

    await driver.quit();
    console.log('all done');
}

test(creds.paypal).catch(err => {
    console.log(err);
    driver.quit();
});