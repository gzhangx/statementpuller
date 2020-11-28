const creds = require('./creds.json');
const moment = require('moment');
const fs = require('fs');
//const https = require('https');
const { sleep, waitElement, driver, By, saveScreenshoot,
    pmap1,
    getFileWithCookies,
    readOneLine,
    saveCookies,
    loadCookies,
} = require('./lib/util');
const { findSafariDriver } = require('selenium-webdriver/safari');

async function test(creds) {
    
    await driver.get(creds.url);
    await loadCookies();

    await sleep(1000);
    await saveScreenshoot();
    await waitElement({
        message: 'Waiting page startup',
        //const readyState = await driver.executeScript("return document.readyState");        
        action: async () => {
            const username = await driver.findElement(By.name('phoneEmailUsername'));
            username.click();
            await username.sendKeys(creds.userName);
            await driver.findElement(By.name('password')).sendKeys(creds.password);     
        }
    });
    
    while (true) {
        await waitElement({
            message: 'Waiting sign in button',
            //const readyState = await driver.executeScript("return document.readyState");        
            action: async () => {
                await sleep(3000);
                await saveScreenshoot();
                const btn = await driver.findElement(By.css('.auth-button'));
                await btn.click();
                console.log('sign in clicked');
                await sleep(2000);
                await saveScreenshoot();
            }
        });

        let good = false;
        for (let i = 0; i < 3; i++) {
            try {
                await driver.findElement(By.name('phoneEmailUsername'));
                await saveScreenshoot();
                console.log('still on login screen');
                await sleep(3000);
                await saveScreenshoot();
            } catch {
                good = true;
            }
            if (good) break;            
        }
        if (good) break;
    }

    const CheckCode = async () => {
        await sleep(1000);
        await saveScreenshoot();
        const sendCode = await driver.findElement(By.css('.mfa-button-code-prompt'));
        await saveScreenshoot();
        console.log('Need code');
        await sleep(1000);
        await sendCode.click();

        await waitElement({
            message: 'WaitSendCode',
            waitSeconds: 5,
            action: async () => {
                const codeField = await driver.findElement(By.css('.auth-form-input'));
                const code = await readOneLine('Please input code');
                codeField.sendKeys(code);
                let btn = await driver.findElement(By.css('.auth-button'));                
                btn.click();
                await sleep(1000);

                const NoRemember = await driver.findElement(By.css('.mfa-button-do-not-remember'));
                btn = await driver.findElement(By.css('.auth-button'));
                btn.click();
                await sleep(1000);
            }
        });
        
    }
    await waitElement({
        message: 'close Notification',
        waitSeconds: 60,
        action: async () => {
            await sleep(1000);
            await saveScreenshoot();
            let good = false;
            try {
                await CheckCode();
                good = true;
            } catch(e) {
                console.log('Not waiting for code step');
            }
            try {
                await driver.findElement(By.xpath("//*[text()[contains(.,'Jinlin Xie')]]"));
                good = true;
            } catch {
                console.log('not login');
            }
            if (!good) throw {
                message:'waiting for code or main screen'
            };
        }
    });

    await waitElement({
        message: 'Wait entrance',
        waitSeconds: 5,
        action: async () => {
            await saveScreenshoot();
            await sleep(1000);
            await driver.findElement(By.xpath("//*[text()[contains(.,'Jinlin Xie')]]"));
        }
    });
    saveCookies();
    //saveScreenshoot();

    const statementUrl = `https://venmo.com/account/statement?end=${moment().format('YYYY-MM-DD')}&start=${moment().add(-89,'days').format('YYYY-MM-DD')}`;
    console.log(statementUrl);
    await saveScreenshoot();
    driver.get(statementUrl);
    await sleep(2000);
    await saveScreenshoot();
    await waitElement({
        message: 'Wait entrance',
        waitSeconds: 5,
        action: async () => {
            await saveScreenshoot();
            await sleep(1000);
            driver.findElement(By.xpath("//*[text()[contains(.,'Completed Transactions')]]"));
        }
    });
    console.log('done');
    await sleep(10000);
    await saveScreenshoot();
    
    await driver.quit();
    console.log('all done');
}

test(creds.venmo).catch(err => {
    console.log(err);
    driver.quit();
});