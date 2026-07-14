import { debug, isPageValid, delay } from '../utils/index.js';
import { sessionStore } from '../cache/sessionStore.js';

export default async function screenshot(page, roll, semester, screenshots, existingSession, needsNewScreenshot) {
    let screenshotSuccess = false;
    debug('📸 Waiting for images to load and taking full screenshot...');
    if (needsNewScreenshot) {
        try {
            // Validate page is still valid before screenshot
            const pageValidForScreenshot = await isPageValid(page);
            if (!pageValidForScreenshot) {
                throw new Error('Page invalid for screenshot');
            }

            // Wait for all images to load with timeout protection
            if (!existingSession) {
                await Promise.race([
                    page.evaluate(() => {
                        const images = Array.from(document.images);
                        const incompleteImages = images.filter(img => !img.complete);

                        // If no incomplete images, resolve immediately
                        if (incompleteImages.length === 0) {
                            return Promise.resolve(); // All images already loaded
                        }

                        return Promise.all(
                            incompleteImages.map(img => new Promise(resolve => {
                                if (img.complete) {
                                    resolve();
                                } else {
                                    img.onload = resolve;
                                    img.onerror = resolve; // Continue even if image fails
                                }
                            }))
                        );
                    }),
                    delay(1000) // Maximum 1 second wait for images
                ]);

                // Small delay for rendering
                await delay(500);
            }
            // Take full screenshot without clipping
            const screenshotBuffer = await page.screenshot({
                type: 'jpeg',
                quality: 80,
                fullPage: true
            });
            const screenshotData = screenshotBuffer.toString('base64');

            screenshots.push({
                name: `${roll}_${semester}_cgpa`,
                data: screenshotData
            });

            debug('📸 Screenshot with images captured successfully');
            screenshotSuccess = true;

        } catch (screenshotError) {
            debug(`⚠️ Screenshot failed: ${screenshotError.message}`);
            screenshotSuccess = false;
            // Try to use existing screenshots ONLY if they're from the same semester
            const existingSessionData = sessionStore.get(roll);
            if (existingSessionData &&
                existingSessionData.screenshots &&
                existingSessionData.screenshots.length > 0 &&
                existingSessionData.semester === semester) {
                debug('📸 Using existing screenshots as fallback (same semester)');
                screenshots = existingSessionData.screenshots;
            } else {
                debug('📸 No valid fallback screenshots available for this semester');
                screenshots = []; // No screenshots available
            }
        }
    } else {
        debug('📸 Using cached screenshots, skipping new screenshot');
        const existingSessionData = sessionStore.get(roll);
        screenshots = existingSessionData?.screenshots || [];
        screenshotSuccess = true; // Consider it successful since we're using cached ones
    }

    return { screenshots };
}