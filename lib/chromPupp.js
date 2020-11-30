const puppeteer = require('puppeteer');
const fs = require('fs');
async function createPuppeteer(props) {
    const browser = await puppeteer.launch(props || {
        headless: false,
        //slowMo: 250 // slow down by 250ms
    });    
    const cookieDir = props.cookiesDir || 'outputData/chrcookies.json';

    const firstPage = await browser.newPage();
    const create = page => {
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        const setText = async (selector, text, doType = true) => {
            const ctl = await page.$(selector);
            await ctl.click();
            let last = '';
            if (doType && text.length > 0) {
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
            findByCSS: path => page.$(path),
            findAllByCss: path => page.$$(path),
            findByXPath: path=>page.$x(path),
            setText,
            setTextBy,
            setTextById: (id,text) => setTextBy('id', id,text),
            setTextByName: (name, text) => setTextBy('name', name, text),
            getElementText: async (e, css) => {
                //const ddd = await page.evaluate(el => el.innerHTML, e);
                //console.log(ddd);
                const ele = await e.$(css);
                const attr = await page.evaluate(el => el.innerHTML, ele);
                return attr;
            },
            screenshot: path => page.screenshot({ path }),
            loadCookies: async () => {
                try {
                    const cookies = JSON.parse(fs.readFileSync(cookieDir));
                    page.setCookie(...cookies);
                } catch { }
            },
            saveCookies: async () => {
                const cookies = await page.cookies();
                await fs.writeFileSync(cookieDir, JSON.stringify(cookies, null, 2));
            }
        };
    }
    return { ...create(firstPage), create };
}

module.exports = {
    createPuppeteer,
}