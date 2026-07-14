import { debug, waitForPageReady, stableClick } from '../utils/index.js';

export default async function marks(page) {
    // Check if we're already on the marks page
    const currentPageUrl = await page.url();
    const needsNavigation = !currentPageUrl.includes('MarksDetailsSem') && !currentPageUrl.includes('Overall');

    if (needsNavigation) {
        // Step 4: Navigate to Marks
        debug('📊 Navigating to Marks Details...');
        const marksSuccess = await stableClick(page, 'Marks Details');
        if (!marksSuccess) {
            throw new Error('Could not find Marks Details');
        }

        await waitForPageReady(page, 1500);
        await page.waitForSelector('a', { visible: true, timeout: 2000 });
        debug('📈 Clicking Overall Marks - Semwise...');
        const overallSuccess = await stableClick(page, 'Overall Marks - Semwise');
        if (!overallSuccess) {
            throw new Error('Could not find Overall Marks - Semwise');
        }

        // Wait for marks page with flexible timeout
        try {
            await page.waitForNavigation({
                waitUntil: 'domcontentloaded',
                timeout: 5000
            });
        } catch (navError) {
            debug('⚠️ Marks navigation timeout, checking if page loaded...');
            await waitForPageReady(page, 1000);
        }

        debug('📊 Marks page loaded');
    } else {
        debug('📊 Already on marks page, skipping navigation');
    }
}