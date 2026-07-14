import { delay, debug } from './index.js';

// Smart navigation waiter
const waitForPageReady = async (page, timeout = 3000) => {
    try {
        await Promise.race([
            page.waitForLoadState?.('domcontentloaded') || Promise.resolve(),
            page.waitForSelector('body', { timeout }),
            delay(timeout)
        ]);
        await delay(200); // Small buffer for dynamic content
        return true;
    } catch (error) {
        debug(`⚠️ Page ready wait timeout: ${error.message}`);
        return false;
    }
};

export default waitForPageReady 
