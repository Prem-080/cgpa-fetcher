import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

console.log("______________________________________________________");

if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production' });
} else {
    dotenv.config({ path: '.env.development' });
}

const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim());

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// Enhanced debug with timing
const debug = (msg) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DEBUG] ${msg}`);
    console.error(`[DEBUG] ${msg}`); // Backup for visibility
};

const sessionStore = new Map(); // Key: roll number, Value: { browser, page, lastUsed, cgpa, studentName, screenshots, semester }

setInterval(() => {
    for (const [roll, session] of sessionStore.entries()) {
        const age = Date.now() - session.lastUsed;
        if (age > 10 * 60 * 1000) { // 10 minutes
            session.page?.close().catch(() => { });
            session.browser?.close().catch(() => { });
            sessionStore.delete(roll);
            debug(`🧹 Cleaned up idle session for ${roll}`);
        }
    }
}, 5 * 60 * 1000); // Run every 5 min


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

app.post('/fetch-grade', async (req, res) => {
    const startTime = Date.now();
    const roll = req.body.roll?.toUpperCase();
    const semester = req.body.semester;

    if (!roll) return res.status(400).json({ error: 'Roll number required' });
    if (!semester) return res.status(400).json({ error: 'Semester selection required' });

    // Check if we have a cached session for this roll and semester
    const existingSession = sessionStore.get(roll);


    // IMPORTANT: Always take fresh screenshots to avoid showing stale data
    // We only cache browser sessions for performance, not screenshots
    const needsNewScreenshot = true; // Always take fresh screenshots

    debug(`📊 Screenshot needed: ${needsNewScreenshot} (always taking fresh screenshots)`);



    let browser;
    let page;
    let screenshots = [];
    let cgpa = '-';
    let studentName = '';


    try {
        debug(`🚀 Starting optimized fetch for ${roll}, semester: ${semester}`);

        // Check if we have an existing session for this roll number
        if (existingSession && existingSession.browser && existingSession.page) {
            debug(`♻️ Reusing browser session for ${roll}`);
            browser = existingSession.browser;
            page = existingSession.page;
            // Update last used time
            existingSession.lastUsed = Date.now();

        } else {
            // Create new browser session
            browser = await puppeteer.launch({
                headless: "new",
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-web-security',
                    '--disable-extensions',
                    '--no-first-run',
                    '--disable-default-apps',
                    '--disable-sync',
                    '--aggressive-cache-discard'
                ],
                defaultViewport: { width: 1024, height: 720 }, // Smaller for speed
                timeout: 8000
            });

            page = await browser.newPage();

            // Optimize page settings
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9'
            });

            // Enhanced request interception
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                const url = req.url();

                // Block unnecessary resources more aggressively
                if (['image', 'stylesheet', 'font', 'media', 'websocket'].includes(resourceType)) {
                    req.abort();
                } else if (resourceType === 'script' && !url.includes('tkrcetautonomous')) {
                    req.abort(); // Block external scripts
                } else {
                    req.continue();
                }
            });



            if (sessionStore.size == 2) {
                sessionStore.delete(sessionStore.keys().next().value); // Remove oldest session if we have 2
                debug('🧹 Removed oldest session to limit memory usage');
            }

            // Store the new session
            sessionStore.set(roll, {
                browser,
                page,
                lastUsed: Date.now(),
                cgpa: null,
                studentName: null,
                screenshots: [],
                semester: null
            });
        }

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


        // Extract student name (async, don't wait)
        const namePromise = page.evaluate(() => {
            const nameEl = document.getElementById('lblStudName');
            return nameEl ? nameEl.innerText.trim() : '';
        }).catch(() => '');

        // Get student name (wait for promise to complete)
        studentName = await namePromise;
        if (studentName) {
            debug(`👤 Student name: ${studentName}`);
        }

        if (!existingSession) {
            // Step 4: Navigate to Marks
            debug('📊 Navigating to Marks Details...');
            const marksSuccess = await stableClick(page, 'Marks Details');
            if (!marksSuccess) {
                throw new Error('Could not find Marks Details');
            }

            await waitForPageReady(page, 1500);
            await await page.waitForSelector('a', { visible: true, timeout: 2000 });
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
        }


        if (!existingSession) {
            debug('🖼️ Enabling images and stylesheet for screenshot...');

            // Remove the previous request interception and set up new one that allows images

            await page.setRequestInterception(false); // Disable current interception
            await page.setRequestInterception(true);  // Re-enable with new rules
            await delay(100);
            page.removeAllListeners('request'); // Remove old listeners
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                const url = req.url();

                // Now ALLOW images but still block other unnecessary resources
                if (['font', 'media', 'websocket'].includes(resourceType)) {
                    req.abort();
                } else if (resourceType === 'script' && !url.includes('tkrcetautonomous')) {
                    req.abort(); // Block external scripts
                } else {
                    req.continue(); // Allow images, documents, xhr, and site scripts
                }
            });
        }

        // Step 5: Select Semester and Extract CGPA (WITHOUT enabling images first)
        debug('🎯 Selecting semester and extracting CGPA...');

        const semesterMap = {
            'I_I': 'I YEAR I SEMES',
            'I_II': 'I YEAR II SEMES',
            'II_I': 'II YEAR I SEMES',
            'II_II': 'II YEAR II SEMES',
            'III_I': 'III YEAR I SEMES',
            'III_II': 'III YEAR II SEMES',
            'IV_I': 'IV YEAR I SEMES',
            'IV_II': 'IV YEAR II SEMES'
        };
        const semesterText = semesterMap[semester];
        if (!semesterText) {
            throw new Error('Invalid semester selection');
        }


        // Enhanced semester selection with proper CGPA extraction
        const result = await page.evaluate(async (semText) => {
            // Find semester button
            const inputs = Array.from(document.querySelectorAll('input[type="submit"]'));
            const semButton = inputs.find(input =>
                input.value && input.value.includes(semText)
            );

            if (!semButton) {
                return { success: false, error: `Semester ${semText} not found` };
            }
            const cgpaButton = document.getElementById('cpStudCorner_lblFinalCGPA');
            let cgpaValue = cgpaButton ? cgpaButton.innerText.trim() : '-';
            // Click semester button
            semButton.click();

            return {
                success: true,
                semesterClicked: true,
                cgpa: cgpaValue

            };
        }, semesterText);

        if (!result.success) {
            return res.status(400).json({ error: `Results for ${semesterText} are not available` });
        }

        // Wait for page to update after semester selection
        await delay(500); // Wait longer for page update


        cgpa = result.cgpa;
        if (cgpa) {
            debug(`💯 CGPA extracted: ${cgpa}`);
        }
        else {
            debug('❌ CGPA not found, returning default value');
            cgpa = '-';
        }

        console.log("screenshot will most likeyly be destroyed!!");

        // Wait for images to load and take screenshot (only if we need new screenshots)
        let screenshotSuccess = false;
        if (needsNewScreenshot) {
            try {
                if (!existingSession) {

                    console.log("Waiting for images to load and taking full screenshot...");

                    await Promise.race([
                        page.evaluate(() => {
                            const images = Array.from(document.images);
                            const incompleteImages = images.filter(img => !img.complete);

                            const stylesheets = Array.from(document.styleSheets);
                            const incompleteStylesheets = stylesheets.filter(stylesheet => !stylesheet.cssRules);

                            if (incompleteStylesheets.length === 0) {
                                return Promise.resolve(); // All stylesheets already loaded
                            }
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

                    await delay(500);
                    // Small delay for rendering

                }

                screenshotSuccess = true;

            } catch (screenshotError) {
                debug(`⚠️ Screenshot failed: ${screenshotError.message}`);
                screenshotSuccess = false;
            }
        }

        if (screenshotSuccess) {
            debug('📸 Taking full screenshot...');
            const screenshotData = await page.screenshot({
                encoding: 'base64',
                type: 'jpeg',
                quality: 80,
                fullPage: true,
            });

            screenshots.push({
                name: `${roll}_${semester}_cgpa`,
                data: screenshotData
            });

            debug('📸 Screenshot with images captured successfully');
        }

        // Update session store with new data
        const session = sessionStore.get(roll);
        if (session) {
            session.cgpa = cgpa;
            session.studentName = studentName;
            session.semester = semester;
            session.lastUsed = Date.now();
            session.screenshots = screenshots;
            debug('✅ Session updated with data');
        }

        const totalTime = Date.now() - startTime;
        debug(`✅ Process completed successfully in ${totalTime}ms`);

        res.json({
            cgpa,
            screenshots,
            studentName,
            processingTime: `${totalTime}ms`,
            cached: false // Always false since we take fresh screenshots
        });

    } catch (error) {
        const totalTime = Date.now() - startTime;
        debug(`❌ Error after ${totalTime}ms: ${error.message}`);

        res.status(500).json({
            error: error.message,
            processingTime: `${totalTime}ms`
        });
    }
    // Note: We don't close browser/page here anymore as we're reusing them
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'CGPA Fetcher API - Stable & Fast',
        version: '2.0',
        endpoints: {
            '/fetch-grade': 'POST - Fetch student CGPA',
            '/health': 'GET - Health check'
        }
    });
});

app.listen(PORT, () => {

    console.log(`🚀 Stable CGPA Fetcher running on port ${PORT}`);
    debug('✅ Server ready - optimized for speed and stability');
});