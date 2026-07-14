import { waitForPageReady, stableClick, delay } from '../utils/index.js';
import {debug} from '../utils/index.js';

export const login = async (page, roll) => {
    try { 
        // Check if we need to login (only if no existing session or different semester)
        const currentUrl = await page.url();
        if (!currentUrl.includes('tkrcetautonomous.org') || currentUrl.includes('Login.aspx')) {
            debug('📡 Navigating to login page...');
            await page.goto('https://www.tkrcetautonomous.org/Login.aspx', {
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });

            await waitForPageReady(page, 2000);
            await delay(100);
            debug('📄 Login page loaded');

            // Step 1: Click Logins
            debug('🔗 Clicking Logins...');
            const loginsSuccess = await stableClick(page, 'Logins');
            if (!loginsSuccess) {
                throw new Error('Could not find or click Logins button');
            }

            await waitForPageReady(page, 1500);

            // Step 2: Click Student Login
            debug('🎓 Clicking Student Login...');
            const studentLoginSuccess = await stableClick(page, 'Student Login');
            if (!studentLoginSuccess) {
                throw new Error('Could not find or click Student Login button');
            }

            await waitForPageReady(page, 2000);

            // Step 3: Login
            debug('🔐 Logging in...');
            try {
                await page.waitForSelector('#txtUserId', { visible: true, timeout: 4000 });

                // Clear and type credentials
                await page.click('#txtUserId', { clickCount: 3 }); // Select all
                await page.type('#txtUserId', roll, { delay: 20 });

                await page.click('#txtPwd', { clickCount: 3 }); // Select all
                await page.type('#txtPwd', roll, { delay: 20 });

                debug('🔑 Submitting login...');

                // Submit and wait for navigation
                await Promise.all([
                    page.waitForNavigation({
                        waitUntil: 'domcontentloaded',
                        timeout: 6000
                    }).catch(() => debug('⚠️ Navigation timeout, continuing...')),
                    page.click('#btnLogin')
                ]);

            } catch (error) {
                debug(`❌ Login error: ${error.message}`);
                throw new Error('Login failed - check roll number or website issues');
            }

            await waitForPageReady(page, 2000);
            debug('✅ Login successful');

        
        } else {
            debug('✅ Already logged in, skipping login process');
        }
    } catch (error) {
        debug(`❌ Login process failed: ${error.message}`);
    }
}