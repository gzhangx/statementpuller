const puppeteer = require('puppeteer');

async function createPuppeteer(props) {
    const browser = await puppeteer.launch(props || {
        headless: false,
        //slowMo: 250 // slow down by 250ms
    });    
    const cookieDir = props.cookiesDir || 'outputData/chrcookies.json';

    const firstPage = await browser.newPage();
    const create = page => {
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        const setText = async (selector, text) => {
            const ctl = await page.$(selector);
            await ctl.click();
            let last = '';
            if (text.length > 0) {
                last = text[text.length - 1];
                text = text.slice(0,-1);
            }
            await page.evaluate((selector, text) => {
                document.querySelector(selector).value = text;
            }, selector, text);
            if (last !== '') {
                ctl.type(last);
            }
        };
        const setTextBy = (what, sel,text) => setText(`[${what}=${sel}]`, text);            
        return {
            browser,
            firstPage,
            page,
            $: p=>page.$(p),
            goto: url=>page.goto(url),
            close: () => browser.close(),
            findBySelector: path=>page.$(path),
            setTextBy,
            setTextById: (id,text) => setTextBy('id', id,text),
            setTextByName: (name, text) => setTextBy('name', name, text),
            screenshot: path => page.screenshot({ path }),
            loadCookies: async () => {
                try {
                    const cookies = JSON.parse(fs.readFileSync(cookieDir));
                    page.setCookie(cookies);
                } catch { }
            },
            saveCookies: async () => {
                const cookies = await page.cookies();
                await fs.writeFile(cookieDir, JSON.stringify(cookies, null, 2));
            }
        };
    }
    return { ...create(firstPage), create };
}

module.exports = {
    createPuppeteer,
}