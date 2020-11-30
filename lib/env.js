const driverConfig = {
    pi: {
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
}

module.exports = {
    getCfg: () => {
        if (process.env.PI) {
            return driverConfig.pi;
        }
        return {
            headless: false,
            //slowMo: 250 // slow down by 250ms
        }
    }
}