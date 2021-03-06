const fs = require('fs');
const { createFireFoxDriver, By } = require('./lib/createDriver');
const driver = createFireFoxDriver();
const Promise = require('bluebird');
const creds = require('./creds.json');
const request = require('superagent');
//const https = require('https');
const { sleep, waitElement} = require('./lib/util');

async function downloadFile(cookiesStr) {
    const action = 'https://secure.bankofamerica.com/myaccounts/details/deposit/download-transactions.go?adx=af796b85c5feaea3955032aaf1e8cfd2935a60895a44f1ef4f04246e728f9587';
    //const action = 'http://localhost:8090/myaccounts/details/deposit/download-transactions.go?adx=af796b85c5feaea3955032aaf1e8cfd2935a60895a44f1ef4f04246e728f9587';
    const cookie = cookiesStr || fs.readFileSync('outputData/cookie.txt').toString();
    const downFile = await request.post(action)
        .set('Cookie', cookie)
        .send('downloadTransactionType=transPeriod')
        .send('selectedTransPeriod=Current transactions')
        .send('formatType=csv')
        .send('searchBean.searchMoreOptionsPanelUsed=false');
    console.log(downFile.body.toString());

    // const data = 'downloadTransactionType=transPeriod&selectedTransPeriod=Current+transactions&formatType=csv&searchBean.searchMoreOptionsPanelUsed=false';
    // const options = {
    //     hostname: 'secure.bankofamerica.com',
    //     port: 443,
    //     path: '/myaccounts/details/deposit/download-transactions.go?adx=af796b85c5feaea3955032aaf1e8cfd2935a60895a44f1ef4f04246e728f9587',
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded',
    //         'Content-Length': data.length,
    //         'Cookie': cookiesStr,
    //     }
    // }

    // const req = https.request(options, res => {
    //     console.log(`statusCode: ${res.statusCode}`)

    //     res.on('data', d => {
    //         process.stdout.write(d)
    //     })
    // })

    // req.on('error', error => {
    //     console.error(error)
    // })

    // req.write(data);
    // req.end()

}

async function test({b1}) {

    await driver.get(creds.b1.url);

    await driver.findElement(By.name('passcode1')).sendKeys(b1.password);
    await driver.findElement(By.id('onlineId1')).sendKeys(b1.userName);    

    //await driver.sleep(1000);
    //await driver.findElement(By.name('q')).sendKeys(webdriver.Key.TAB);
    //await driver.sleep(1000);
  
    await waitElement({
        message: 'Waiting sign in button',
        //const readyState = await driver.executeScript("return document.readyState");        
        action: async ()=> {
            const btn = await driver.findElement(By.id('signIn'));
            await btn.click();            
        }
    })
  
    const waitStatements = () => driver.findElement(By.id('fsd-li-accounts')).click();
    const saveScreenshoot = async () => {
        const image = await driver.takeScreenshot();
        fs.writeFile('outputData/out.png', image, 'base64', function (err) {
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
            let DDA_details = null;
            await Promise.map(accountItems, async item => {
                await saveScreenshoot();
                //const DDA_details = await item.findElement(By.name('DDA_details'));
                //const mul = await findByMultiple('name', ['DDA_details', 'SDA_details'], item);
                const balanceValue = await item.findElement(By.css('.balanceValue'));
                const accountNameA = await item.findElement(By.css('.AccountName a'));
                //const name = await mul.itm.getAttribute('innerHTML');
                const bal = await balanceValue.getAttribute('innerHTML');
                const text = await accountNameA.getAttribute('innerHTML');
                const name = await accountNameA.getAttribute('name');
                if (name === 'DDA_details') {
                    DDA_details = accountNameA;
                }
                console.log(`${text} ${bal}`);
                await saveScreenshoot();
            });
            
            await DDA_details.click();
            //console.log(await accounts.getAttribute('innerHTML'))            

        }
    })

    await waitElement({
        message: 'download_transactions_top',
        action: async () => {
            await saveScreenshoot();
            const downForm = await driver.findElement(By.name('transactionDownloadForm'));
            const action = await downForm.getAttribute('action');
            //console.log(action);
            //const cookiesStr = await driver.executeScript("return document.cookie");
            const cks = await driver.manage().getCookies();            
            await saveScreenshoot();
            const cookiesStr = cks.map(c => `${c.name}=${c.value}`).join('; ');
            //console.log(cookiesStr);
            fs.writeFileSync('outputData/cookie.txt', cookiesStr);
            await downloadFile(cookiesStr);
            await saveScreenshoot();
            // const download = await driver.findElement(By.name('download_transactions_top')).click();
            // const sel = await driver.findElement(By.id('select_filetype'));
            // const selId = await sel.getAttribute('id');
            // //await driver.selectByValue(sel, 'css');
            // await driver.executeScript(`document.getElementById('${selId}').value='csv';`);

            // const downloads = await driver.findElements(By.css('.submit-download'));
            // await Promise.map(downloads, async (download, ind) => {
            //     console.log('check downloaing ' + ind);
            //     const text = await download.getAttribute('innerHTML');
            //     console.log(text);
            //     //download.click();
            // });
        }
    })
    await sleep(1000);
    //const cookies = await driver.manage().getCookies();
    //fs.writeFileSync('cookies.json', JSON.stringify());
    
    await saveScreenshoot();
            
    driver.quit();
}

test(creds).catch(err => {
    console.log(err);
});