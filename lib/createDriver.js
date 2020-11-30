// const webdriver = require('selenium-webdriver'),
//     By = webdriver.By,
//     until = webdriver.until;

// function createFireFoxDriver() {
//     const firefox = require('selenium-webdriver/firefox');
//     var firefoxOptions = new firefox.Options();
//     //firefoxOptions.setBinary('D:\\utils\\geckodriver-0.27\\geckodriver.exe');
//     firefoxOptions.setBinary('C:\\Program Files\\Mozilla Firefox\\firefox.exe');
//     firefoxOptions.headless();

//     const driver = new webdriver.Builder()
//         .forBrowser('firefox')
//         .setFirefoxOptions(firefoxOptions)
//         .build();
//     return driver;   
// }

// module.exports = {
//     webdriver,
//     createFireFoxDriver,
//     By,
//     until,
// }