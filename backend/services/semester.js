import { debug, delay, isPageValid } from '../utils/index.js';
import { SEMESTER_MAP, CGPA_ELEMENT_ID } from '../utils/constants.js';

export default async function extract_cgpa(page, semester, existingSession) {
    const semesterText = SEMESTER_MAP[semester];
    if (!semesterText) {
        throw new Error('Invalid semester selection');
    }

    // Enhanced semester selection with CGPA extraction - BEFORE clicking
    const preClickResult = await page.evaluate(({semText, cgpaId}) => {
        const inputs = Array.from(document.querySelectorAll('input[type="submit"]'));
        const semButton = inputs.find(input =>
            input.value && input.value.includes(semText)
        );

        if (!semButton) {
            return { success: false, error: `Semester ${semText} not found` };
        }

        const cgpaElement = document.getElementById(cgpaId);
        const cgpaValue = cgpaElement ? cgpaElement.innerText.trim() : '-';

        return {
            success: true,
            cgpa: cgpaValue,
            buttonFound: true
        };
    }, {semText: semesterText, cgpaId: CGPA_ELEMENT_ID});

    if (!preClickResult.success) {
        throw new Error(`Results for ${semesterText} are not available`);
    }

    // NOW enable images AFTER semester validation (only if we need screenshots)
    if (!existingSession) {
        debug('🖼️ Enabling images and stylesheets for screenshot...');

        // Remove the previous request interception and set up new one that allows images
        // Remove previous route and allow images/stylesheets for screenshot
        await page.unroute('**/*');
        await page.route('**/*', (route) => {
            const request = route.request();
            const resourceType = request.resourceType();
            const url = request.url();
            if (["font", "media", "websocket"].includes(resourceType)) {
                route.abort();
            } else if (resourceType === 'script' && !url.includes('tkrcetautonomous')) {
                route.abort();
            } else {
                route.continue();
            }
        });
        await delay(500);
    }

    // NOW click the semester button and handle potential navigation
    debug('🖱️ Clicking semester button...');

    const clickResult = await page.evaluate((semText) => {
        const inputs = Array.from(document.querySelectorAll('input[type="submit"]'));
        const semButton = inputs.find(input =>
            input.value && input.value.includes(semText)
        );

        if (semButton) {
            semButton.click();
            return { clicked: true };
        }
        return { clicked: false };
    }, semesterText);

    if (!clickResult.clicked) {
        throw new Error('Please select the appropriate semester!');
    }

    // Wait for potential navigation or page update after clicking
    try {
        await Promise.race([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 3000 }),
            delay(2000) // Fallback delay
        ]);
        debug('✅ Page updated after semester selection');
    } catch (navError) {
        debug('⚠️ No navigation detected, assuming page updated in place');
    }

    // Validate page is still accessible after click
    const pageStillValid = await isPageValid(page);
    if (!pageStillValid) {
        throw new Error('Page became invalid after semester selection');
    }

    // Extract CGPA after clicking
    let cgpa = await page.evaluate((cgpaId) => {
        const cgpaElement = document.getElementById(cgpaId);
        return cgpaElement ? cgpaElement.innerText.trim() : '-';
    }, CGPA_ELEMENT_ID).catch(() => preClickResult.cgpa);

    if (!cgpa || cgpa === '-') {
        // Use pre-click CGPA as fallback
        cgpa = preClickResult.cgpa;
        if (!cgpa || cgpa === '-') {
            debug('CGPA not found on page');
        }
    }

    debug(`💯 CGPA extracted: ${cgpa}`);
    return cgpa;
}