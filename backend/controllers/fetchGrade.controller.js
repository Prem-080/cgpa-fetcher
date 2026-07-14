import { chromium } from 'playwright';
import { getOrCreateSession, login, marks, screenshot, updateSession, extract_cgpa } from '../services/index.js';
import { debug, delay, stableClick, waitForPageReady, isPageValid, cleanup, sgpa } from '../utils/index.js';
import { sessionStore } from '../cache/sessionStore.js';

export const fetchGrade = async (req, res) => {
    const startTime = Date.now();
    const roll = req.body.roll?.toUpperCase();
    const semester = req.body.semester;

    if (!roll) return res.status(400).json({ error: 'Roll number required' });
    if (!semester) return res.status(400).json({ error: 'Semester selection required' });

    const session = await getOrCreateSession(roll, semester);

    if (session.cached) {
        return res.json({
            ...session.data,
            processingTime: "0ms (cached)",
            cached: true
        });
    }

    const {
        browser,
        page,
        existingSession,
        needsNewScreenshot,
    } = session;

    let screenshots = session.screenshots;

    try {
        await login(page, roll);


        // Extract student name (async, don't wait)
        const namePromise = page.evaluate(() => {
            const nameEl = document.getElementById('lblStudName');
            return nameEl ? nameEl.innerText.trim() : '';
        }).catch(() => '');

        // Get student name (wait for promise to complete)
        const studentName = await namePromise;
        if (studentName) {
            debug(`👤 Student name: ${studentName}`);
        }

        // Step 4: Navigate to Marks page and ensure it's loaded
        await marks(page);

        // Step 5: Select Semester and Extract CGPA
        debug('🎯 Selecting semester and extracting CGPA...');

        const cgpa = await extract_cgpa(page, semester, existingSession);


        // Wait for images to load and take screenshot (only if we need new screenshots)
        const ss = await screenshot(page, roll, semester, screenshots, existingSession, needsNewScreenshot);
        screenshots = ss.screenshots;


        let sgpaValue;
        // Always try to calculate SGPA if we have a valid page
        try {
            sgpaValue = await sgpa(page);
            debug(`📊 SGPA calculated: ${sgpaValue}`);
        } catch (sgpaError) {
            debug(`⚠️ SGPA calculation failed: ${sgpaError.message}`);
            sgpaValue = null;
        }

       await updateSession(roll, cgpa, semester, studentName, screenshots, sgpaValue, existingSession, needsNewScreenshot);

        const totalTime = Date.now() - startTime;
        debug(`✅ Process completed successfully in ${totalTime}ms`);

        const responseData = {
            cgpa,
            screenshots,
            studentName,
            processingTime: `${totalTime}ms`,
            sgpaValue,
            cached: false
        };
        debug(`📤 Sending response with SGPA: ${responseData.sgpaValue}`);

        res.json(responseData);

    } catch (error) {
        const totalTime = Date.now() - startTime;
        debug(`❌ Error after ${totalTime}ms: ${error && error.message ? error.message : String(error)}`);

        // Also log to stderr so hosting platforms reliably surface the error
        try {
            console.error('Caught error in /fetch-grade:', error);
        } catch (logErr) {
            debug(`⚠️ Failed to console.error the error: ${logErr && logErr.message ? logErr.message : String(logErr)}`);
        }

        // Clean up invalid session on error
        if (sessionStore.has(roll)) {
            await cleanup(roll);
        }

        res.status(400).json({
            error: error && error.message ? error.message : String(error),
            processingTime: `${totalTime}ms`
        });
    }
    // Note: We don't close browser/page here anymore as we're reusing them
}