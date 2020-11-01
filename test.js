const fs = require('fs');
const { createFireFoxDriver, By } = require('./lib/createDriver');
const driver = createFireFoxDriver();
const Promise = require('bluebird');
const creds = require('./creds.json');
const readline = require('readline');

async function waitElement({
    message,
    action,
    waitSeconds = 120,
    sleepInterval = 1000,
}) {
    console.log(`Starting ${message}`);
    const waitLoopCnt = waitSeconds * 1000 / sleepInterval;
    const errors = [];
    for (let i = 0; i < waitLoopCnt; i++) {
        //const readyState = await driver.executeScript("return document.readyState");        
        try {
            return await action();
        } catch (err) {
            errors.push(err.message);
            await driver.sleep(sleepInterval);
        }
    }
    throw {
        message: `Timeout ${message}: ${errors[0]}`,
        errors,
    }
}

async function findByMultiple(method, tags, item) {
    let throwErr = null;
    for (let i = 0; i < tags.length; i++) {
        try {
            const tag = tags[i];
            return {
                tag,
                itm: await item.findElement(By[method](tag)),
            };
        } catch (err) {
            throwErr = err;
        }
    }
    throw throwErr;
}
function readOneLine(prompt) {
    return new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(prompt, (answer) => {
            resolve(answer);
            rl.close();
        });
    });
}

async function test({b1}) {

    await driver.get(creds.b1.url);

    await driver.findElement(By.name(b1.pwdName)).sendKeys(b1.password);
    await driver.findElement(By.id(b1.idName)).sendKeys(b1.userName);    

    //await driver.sleep(1000);
    //await driver.findElement(By.name('q')).sendKeys(webdriver.Key.TAB);
    //await driver.sleep(1000);
  
    await waitElement({
        message: 'Waiting sign in button',
        //const readyState = await driver.executeScript("return document.readyState");        
        action: async ()=> {
            const btn = await driver.findElement(By.id(b1.btnName));
            await btn.click();            
        }
    })
  
    const waitStatements = () => driver.findElement(By.id('fsd-li-accounts')).click();
    const saveScreenshoot = async () => {
        const image = await driver.takeScreenshot();
        fs.writeFile('out.png', image, 'base64', function (err) {
            if (err) console.log(err);
        });
    }
    await waitElement({
        message: 'Phone verificaton',
        action: async () => {
            try {
                await waitStatements();
                console.log('phone verification already done');
                return;
            } catch (err) {
                //console.log(`err find statements ${err.message}`);
            }
            
            await saveScreenshoot();
            const ph1 = await driver.findElement(By.id('tlpvt-phone1'));
            console.log(`got ph1 ${ph1}`);
            await ph1.click();
            await driver.findElement(By.id('btnARContinue')).click();
            await waitElement({
                message: 'PhoneCode',
                action: () => driver.findElement(By.id('tlpvt-acw-authnum')),
            });
            const code = await readOneLine('Please input code');
            console.log(`sending code ${code}`);
            await driver.findElement(By.id('tlpvt-acw-authnum')).sendKeys(code);
            await driver.findElement(By.id('yes-recognize')).click();
            await driver.findElement(By.id('continue-auth-number')).click();            
        }
    });
    //await driver.sleep(1000);

    await waitElement({
        message: 'statements',
        action: waitStatements,
    })

    const title = await driver.getTitle();
    console.log('title is = ' + title);
    
    await waitElement({
        message: 'Accounts',
        action: async () => {
            const accounts = await driver.findElement(By.css('.AccountItems'));
            const accountItems = await accounts.findElements(By.css('.AccountItem'));
            await Promise.map(accountItems, async item => {
                //const DDA_details = await item.findElement(By.name('DDA_details'));
                //const mul = await findByMultiple('name', ['DDA_details', 'SDA_details'], item);
                const balanceValue = await item.findElement(By.css('.balanceValue'));
                const accountNameA = await item.findElement(By.css('.AccountName a'));
                //const name = await mul.itm.getAttribute('innerHTML');
                const bal = await balanceValue.getAttribute('innerHTML');
                const name = await accountNameA.getAttribute('innerHTML');
                console.log(`${name} ${bal}`);
            });
            
            //console.log(await accounts.getAttribute('innerHTML'))            

        }
    })
    //await driver.sleep(5000);
    //const cookies = await driver.manage().getCookies();
    //fs.writeFileSync('cookies.json', JSON.stringify());
    
    await saveScreenshoot();
            
    driver.quit();
}

test(creds).catch(err => {
    console.log(err);
});