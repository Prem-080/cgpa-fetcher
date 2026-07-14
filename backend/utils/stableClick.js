import {debug, delay} from './index.js';

// Stable click helper with multiple strategies
const stableClick = async (page, text, maxAttempts = 3) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            debug(`Attempt ${attempt}: Looking for "${text}"`);

            // Strategy 1: Direct evaluation with immediate click
            const clicked = await page.evaluate((searchText) => {
                const links = Array.from(document.querySelectorAll('a'));
                const target = links.find(link =>
                    link.textContent && link.textContent.trim().includes(searchText)
                );
                if (target && target.offsetParent !== null) { // Check if visible
                    target.click();
                    return true;
                }
                return false;
            }, text);

            if (clicked) {
                debug(`✅ Successfully clicked "${text}" on attempt ${attempt}`);
                return true;
            }

            // Strategy 2: Wait and retry
            if (attempt < maxAttempts) {
                debug(`❌ Failed attempt ${attempt}, waiting 300ms...`);
                await delay(300);
            }

        } catch (error) {
            debug(`❌ Error on attempt ${attempt}: ${error.message}`);
            if (attempt < maxAttempts) {
                await delay(500);
            }
        }
    }

    debug(`❌ Failed to click "${text}" after ${maxAttempts} attempts`);
    return false;
};


export default stableClick 