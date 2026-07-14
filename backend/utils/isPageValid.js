
// Helper function to check if page is still valid
const isPageValid = async (page) => {
    try {
        await page.evaluate(() => document.title);
        return true;
    } catch (error) {
        debug(`⚠️ Page validation failed: ${error.message}`);
        return false;
    }
};

export default isPageValid