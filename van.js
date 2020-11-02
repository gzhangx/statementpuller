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

    await waitElement({
        message: 'Waiting page startup',
        //const readyState = await driver.executeScript("return document.readyState");        
        action: async () => {
            await driver.findElement(By.id('password')).sendKeys(creds.password);
            await driver.findElement(By.id('username')).sendKeys(creds.userName);     
        }
    });    

    await waitElement({
        message: 'Waiting sign in button',
        //const readyState = await driver.executeScript("return document.readyState");        
        action: async () => {
            const btn = await driver.findElement(By.css('.vui-button'));
            await btn.click();
        }
    });

    if (false) {
        await waitElement({
            message: 'close Notification',
            waitSeconds: 5,
            action: async () => {
                await saveScreenshoot();
                const btn = await driver.findElement(By.css('.vuiLayerCloseButton'));
                await btn.click();
            }
        });
    }

    let veryCnt = 0;
    await waitElement({
        message: 'Code',
        action: async (msg, ind) => {
            try {
                await driver.findElement(By.id('sncTabSetBalanceOverviewTab'));
                console.log('already 2f');
                return;
            } catch (err) {}
            await driver.findElement(By.id('YES')).click();
            await saveScreenshoot();
            const code = await readOneLine('Please input code');
            await driver.findElement(By.id('code')).sendKeys(code);
            const loginGrps = await driver.findElements(By.css('.logon-input-group'));
            await pmap1(loginGrps, async loginGrp => {                            
                //const debugTxt1 = await loginGrp.getAttribute('innerHTML');
                //console.log(debugTxt1);
                //const dbgCss = await loginGrp.findElements(By.css('.vuiButton'));
                const btns = await loginGrp.findElements(By.css('button'));
                console.log(btns.length)
                const btn1 = btns[1];
                if (btn1) {
                    const btnTxt = await btn1.getAttribute('innerHTML');
                    console.log(btnTxt);
                    await btn1.click();
                    await saveScreenshoot();
                }
            });
            if (veryCnt === 0) {
                console.log('test again');
                veryCnt++;
                throw {
                    message: 'test again'
                }
            }
            console.log('test done');
        }
    })
    await saveScreenshoot();
    
    await waitElement({
        message: 'go to https://personal.vanguard.com/us/Statements',
        action: async () => {
            await driver.executeScript(`window.location.href = 'https://personal.vanguard.com/us/Statements';`);
        }
    });
    

    await waitElement({
        message: 'StmtSummaryForm:stmtDataTabletbody0',
        action: async message => {
            await saveScreenshoot();
            const statements = await driver.findElement(By.id(message));
            const eles = await statements.findElements(By.css('tr'));            
            await pmap1(eles, async (ele, linePos) => {
                let dateStr = '';
                let fileDesc = '';
                let href = '';
                const tds = await ele.findElements(By.css('td'));
                await pmap1(tds, async (td, ind) => {
                    const txt = await td.getAttribute('innerHTML'); 
                    if (ind === 0) {
                        dateStr = moment(txt, 'MM/DD/YYYY').format('YYYYMMDD');
                    } else if (ind === 1) {
                        fileDesc = txt.replace(/&amp;/g, '_').replace(/ /g,'_');
                    }else  if (ind === 2) {
                        const aTag = await td.findElement(By.css('a'));
                        href = await aTag.getAttribute('href')
                        //console.log(href);                        
                    } 
                    //https://personal.vanguard.com/us/StmtCnfmViewPDFImage?hsg=n&adobChk=n&year=2020&dateView=n&id=0&rid=897872640000283202010011601592210897875827790&raId=VAN2000&srcInd=RRD&viewing=s&dateCheck=false
                });
                if (href) {
                    const fileName = `${dateStr}_${fileDesc}_${linePos}.pdf`;
                    if (!fs.existsSync(fileName)) {
                        console.log(`creating ${fileName}`);
                        await getFileWithCookies(href, fileName);
                    }
                }
            });
        }
    })
    await sleep(1000);
    //const cookies = await driver.manage().getCookies();
    //fs.writeFileSync('cookies.json', JSON.stringify());

    await saveScreenshoot();

    await saveCookies();
    await driver.quit();
}

test(creds.van).catch(err => {
    console.log(err);
    driver.quit();
});