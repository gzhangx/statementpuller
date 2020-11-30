set PATH=%PATH%;D:\utils\geckodriver-0.27

## rpi setu
sudo apt install chromium-browser chromium-codecs-ffmpeg
npm i puppeteer

const puppeteer = require('puppeteer');

(async () => {
  //const browser = await puppeteer.launch();
const browser = await puppeteer.launch({
          headless: true,
          executablePath: '/usr/bin/chromium-browser',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({path: 'example.png'});

  await browser.close();
})();