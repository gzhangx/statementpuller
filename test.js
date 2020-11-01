const fs = require('fs');
const { createFireFoxDriver, By } = require('./lib/createDriver');
const driver = createFireFoxDriver();

const creds = require('./creds.json');

async function test({b1}) {

    await driver.get(creds.b1.url);

    await driver.findElement(By.name(b1.pwdName)).sendKeys(b1.password);
    await driver.findElement(By.id(b1.idName)).sendKeys(b1.userName);    

    //await driver.sleep(1000);
    //await driver.findElement(By.name('q')).sendKeys(webdriver.Key.TAB);
    //await driver.sleep(1000);
  
    for (let i = 0; i < 10; i++) {
        //const readyState = await driver.executeScript("return document.readyState");        
        try {
            const btn = await driver.findElement(By.id(b1.btnName));
            await btn.click();
            break;
        } catch (err) {
            console.log(err.message);
            await driver.sleep(1000);
        }
    }
  
    await driver.sleep(1000);

    const title = await driver.getTitle();
    console.log('title is = ' + title);
    if (title === 'webdriver - Google Search') {
        console.log('Test passed');
    } else {
        console.log('Test failed');
    }
    const image = await driver.takeScreenshot();
        
    fs.writeFile('out.png', image, 'base64', function (err) {
        if (err) console.log(err);
    });
            
    driver.quit();
}

test(creds).catch(err => {
    console.log(err);
});