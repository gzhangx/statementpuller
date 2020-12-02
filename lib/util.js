const Promise = require('bluebird');
const readline = require('readline');
const fs = require('fs');
const request = require('superagent');
//const { createFireFoxDriver, By } = require('./createDriver');
//const driver = createFireFoxDriver();

async function waitElement({
    message,
    action,
    waitSeconds = 60,
    sleepInterval = 1000,
    debug = true,
}) {
    if (debug) console.log(`Starting ${message}`);
    const waitLoopCnt = waitSeconds * 1000 / sleepInterval;
    const errors = [];
    for (let i = 0; i < waitLoopCnt; i++) {
        //const readyState = await driver.executeScript("return document.readyState");        
        try {
            return await action(message, i);
        } catch (err) {
            errors.push(err.message);
            if (debug) console.log(err.message);
            await sleep(sleepInterval);
        }
    }
    throw {
        message: `Timeout ${message}: ${errors[0]}`,
        errors,
    }
}

async function sleep(ms) {
    return await Promise.delay(ms);
}


// async function findByMultiple(method, tags, item) {
//     let throwErr = null;
//     for (let i = 0; i < tags.length; i++) {
//         try {
//             const tag = tags[i];
//             return {
//                 tag,
//                 itm: await item.findElement(By[method](tag)),
//             };
//         } catch (err) {
//             throwErr = err;
//         }
//     }
//     throw throwErr;
// }
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

// const saveScreenshoot = async () => {
//     const image = await driver.takeScreenshot();
//     fs.writeFile('outputData/out.png', image, 'base64', function (err) {
//         if (err) console.log(err);
//     });
// }

const pmap1 = (itms, action, concurrency) => Promise.map(itms, action, { concurrency });

// async function getFileWithCookies(url, filename, dir='outputData') {
//     const cks = await driver.manage().getCookies();
//     const cookiesStr = cks.map(c => `${c.name}=${c.value}`).join('; ');
//     const downFile = request.post(url)
//         .set('Cookie', cookiesStr)
//         .send();
//     const stream = fs.createWriteStream(`${dir}/${filename}`);
//     downFile.pipe(stream);
//     //await downFile;
//     //downFile.log(downFile.body.toString());
// }

// const SAVED_COOKIE_FILE = 'outputData/cookies.json';
// async function saveCookies() {
//     const cks = await driver.manage().getCookies();    
//     //console.log(cookiesStr);
//     fs.writeFileSync(SAVED_COOKIE_FILE, JSON.stringify(cks, null, 2));
// }

// async function loadCookies() {    
//     //console.log(cookiesStr);
//     let errorCookieNames = '';
//     try {
//         const cookies = JSON.parse(fs.readFileSync(SAVED_COOKIE_FILE)).map(c => {
//             if (c.sameSite === 'None') {
//                 return {
//                     ...c,
//                     sameSite: 'Strict',
//                 }
//             }
//             return c;
//         });
//         await pmap1(cookies, async cookie => {
//             try {
//                 await driver.manage().addCookie(cookie);
//             } catch (err) {
//                 //console.log(`add Cookie error ${err.message} ${JSON.stringify(cookie)}`);
//                 errorCookieNames += ' ' + cookie.name;
//             }
//         });
//         if (errorCookieNames) console.log(`Error cookies ${errorCookieNames}`);
//     } catch (err) {
//         console.log(`Add Cookies err ${err.message}`);
//     }    
// }

module.exports = {
    sleep,
    waitElement,
    //findByMultiple,
    readOneLine,
    //driver,
    //By,
    //saveScreenshoot,
    pmap1,
    //getFileWithCookies,
    //saveCookies,
    //loadCookies,
}