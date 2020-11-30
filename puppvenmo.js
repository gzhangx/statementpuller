const fs = require('fs');
const { createPuppeteer } = require('./lib/chromPupp');
const { sleep,
    waitElement,
    readOneLine,
} = require('./lib/util');
const creds = require('./creds.json');
const { Promise } = require('bluebird');
async function test(creds) {
    const pupp = await createPuppeteer({
        headless: false,
        slowMo: 250 // slow down by 250ms
    });
    
    //const cookies = JSON.parse(fs.readFileSync('outputData/chrcookies.json'));
    //pupp.page.setCookie(cookies);
    await pupp.loadCookies();
        
    await pupp.goto('https://venmo.com/account/sign-in'); //creds.url
    console.log('opened');
    let tryNum = 0;
    while (true) {
        try {
            //(await pupp.$('a.sign-in.active')).click();
            console.log('went to active, gong user try ' + tryNum  );
            tryNum++;
            await pupp.setTextByName('phoneEmailUsername', creds.userName);            
            await pupp.setTextByName('password', creds.password);            
            const btn = await pupp.$('.auth-button');
            console.log('auth clock');
            await sleep(4000);
            await btn.click();
            console.log('auth clicked');
        } catch {
            console.log('done, breaking')
            break;
        }
    }
        
    const saveScreenshoot = ()=>pupp.screenshot('outputData/test.png');

    const loggedInCheck = async () => {
        const jl = await pupp.findBySelector("//*[text()[contains(.,'Jinlin Xie')]]");
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
                codeField.sendKeys(code);
                let btn = await pupp.findBySelector('.auth-button');
                btn.click();
                await sleep(1000);

                const NoRemember = await pupp.findBySelector('.mfa-button-do-not-remember');
                btn = await driver.findElement(By.css('.auth-button'));
                btn.click();
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
    //html body div#app div div div#content div.container-fluid div form.auth-form fieldset.inputs label.error.auth-form-input-label input.auth-form-input
    await pupp.close();
}

test(creds.venmo).catch(err => {
    console.log(err);
})