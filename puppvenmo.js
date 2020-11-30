const fs = require('fs');
const { createPuppeteer } = require('./lib/chromPupp');
const { sleep,
    waitElement,
    readOneLine,
} = require('./lib/util');
const moment = require('moment');
const creds = require('./creds.json');
const { Promise } = require('bluebird');
async function test(creds) {
    const pupp = await createPuppeteer({
        headless: false,
        slowMo: 250 // slow down by 250ms
    });
    
    //const cookies = JSON.parse(fs.readFileSync('outputData/chrcookies.json'));
    //pupp.page.setCookie(cookies);    
        
    await pupp.goto('https://venmo.com/account/sign-in'); //creds.url
    await pupp.loadCookies();
    console.log('opened');
    let tryNum = 0;
    while (true) {
        try {
            //(await pupp.$('a.sign-in.active')).click();
            await sleep(1000);
            console.log('went to active, gong user try ' + tryNum  );
            tryNum++;
            await pupp.setTextByName('phoneEmailUsername', creds.userName);            
            await pupp.setTextByName('password', creds.password);            
            const btn = await pupp.$('.auth-button');
            console.log('auth clock');
            await sleep(4500);
            await btn.click();
            console.log('auth clicked');
        } catch {
            console.log('done, breaking')
            break;
        }
    }
        
    const saveScreenshoot = ()=>pupp.screenshot('outputData/test.png');

    const loggedInCheck = async () => {
        const jl = await pupp.findByXPath("//*[text()[contains(.,'Jinlin Xie')]]");
        if (!jl) throw { message: 'not ready' };
    }
    const CheckCode = async () => {
        await sleep(1000);
        await saveScreenshoot();
        const sendCode = await pupp.findBySelector('.mfa-button-code-prompt');
        await saveScreenshoot();
        console.log('Need code');
        await sleep(1000);
        await sendCode.click();

        await waitElement({
            message: 'WaitSendCode',
            waitSeconds: 5,
            action: async () => {
                const codeField = await pupp.findBySelector('.auth-form-input');
                const code = await readOneLine('Please input code');
                pupp.setText('.auth-form-input', code);
                let btn = await pupp.findBySelector('.auth-button');
                await sleep(1000);
                btn.click();
                await sleep(3000);

                //document.querySelector("#content > div > div > div > form > div > button.ladda-button.auth-button")
                ////*[@id="content"]/div/div/div/form/div/button[1]
                //#content > div > div > div > form > div > button.ladda-button.auth-button
                //const NoRemember = await pupp.findBySelector('.mfa-button-do-not-remember');
                btn = await pupp.findBySelector('button.ladda-button.auth-button');
                btn.click();
                await sleep(3000);
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
            } catch (e) {
                console.log('Not waiting for code step');
            }
            try {
                await loggedInCheck()
                good = true;
            } catch {
                console.log('not login');
            }
            if (!good) throw {
                message: 'waiting for code or main screen'
            };
        }
    });

    //const cookies = await pupp.page.cookies();
    //await fs.writeFile('outputData/test.png', JSON.stringify(cookies, null, 2));
    await pupp.saveCookies();
    await sleep(10000);



    //step2
    const statementUrl = `https://venmo.com/account/statement?end=${moment().format('YYYY-MM-DD')}&start=${moment().add(-89, 'days').format('YYYY-MM-DD')}`;
    console.log(statementUrl);
    await saveScreenshoot();
    pupp.goto(statementUrl);
    await sleep(2000);
    await saveScreenshoot();
    await waitElement({
        message: 'Wait entrance',
        waitSeconds: 5,
        action: async () => {
            await saveScreenshoot();
            await sleep(1000);
            const tran = await pupp.findByXPath("//*[text()[contains(.,'Completed Transactions')]]");
            if (!tran) throw {message:'need tran'}
        }
    });


    console.log('done');
    await sleep(10000);
    await saveScreenshoot();
    //html body div#app div div div#content div.container-fluid div form.auth-form fieldset.inputs label.error.auth-form-input-label input.auth-form-input
    await pupp.close();
}

test(creds.venmo).catch(err => {
    console.log(err);
})