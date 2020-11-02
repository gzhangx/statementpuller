const Promise = require('bluebird');
const readline = require('readline');
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
            return await action();
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

module.exports = {
    sleep,
    waitElement,
    findByMultiple,
    readOneLine,
}