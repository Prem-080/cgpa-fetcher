import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

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

const debug = (msg) => console.log(`[DEBUG] ${msg}`);

// Helper function for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/fetch-grade', async (req, res) => {
    const roll = req.body.roll.toUpperCase();
    const semester = req.body.semester;
    if (!roll) return res.status(400).json({ error: 'Roll number required' });
    if (!semester) return res.status(400).json({ error: 'Semester selection required' });

    let browser;
    let screenshots = [];
    let cgpa = '-';
    try {
        debug('Launching browser...');
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
            ],
            defaultViewport: { width: 1280, height: 800 }
        });

        const page = await browser.newPage();

        // Enable console log from browser
        page.on('console', msg => debug(`Browser Console: ${msg.text()}`));

        debug('Navigating to login page...');
        await page.goto('https://www.tkrcetautonomous.org/Login.aspx', {
            waitUntil: ['domcontentloaded', 'networkidle0'],
            timeout: 15000
        });

        // Wait for page to be fully loaded
        await delay(500);

        debug('Looking for Logins link...');
        // Try multiple selector strategies for "Logins"
        try {
            await page.waitForFunction(
                () => {
                    const links = Array.from(document.querySelectorAll('a'));
                    return links.some(link => link.textContent.includes('Logins'));
                },
                { timeout: 5000 }
            );

            await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const loginLink = links.find(a => a.textContent.includes('Logins'));
                if (loginLink) {
                    loginLink.click();
                } else {
                    throw new Error('Login link not found');
                }
            });
        } catch (e) {
            debug(`Failed to find Logins link: ${e.message}`);
            throw new Error('Could not find Logins button. Is the website structure changed?');
        }

        await delay(300);
        debug('Looking for Student Login link...');

        // Try to find and click "Student Login"
        try {
            await page.waitForFunction(
                () => {
                    const links = Array.from(document.querySelectorAll('a'));
                    return links.some(link => link.textContent.includes('Student Login'));
                },
                { timeout: 5000 }
            );

            await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const studentLogin = links.find(a => a.textContent.includes('Student Login'));
                if (studentLogin) {
                    studentLogin.click();
                } else {
                    throw new Error('Student Login link not found');
                }
            });
        } catch (e) {
            debug(`Failed to find Student Login link: ${e.message}`);
            throw new Error('Could not find Student Login button');
        }

        // Wait for navigation and login form
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 8000 });
        debug('Entering credentials...');

        // Login form
        await page.waitForSelector('#txtUserId', { visible: true, timeout: 5000 });
        await page.type('#txtUserId', roll, { delay: 50 });
        await page.type('#txtPwd', roll, { delay: 50 });
        await page.click('#btnLogin');

        // Wait for navigation after login with shorter timeout
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 });
        await delay(300);

        // Extract student name after login
        debug('Extracting student name...');
        let studentName = '';
        try {
            // Extract name asynchronously
            studentName = await page.$eval('#lblStudName', el => el.innerText.trim());

            if (studentName) {
                debug(`Found student name: ${studentName}`);
            } else {
                debug('No student name found');
            }
        } catch (e) {
            debug(`Error finding student name: ${e.message}`);
            debug('Will continue without student name');
        }

        debug('Looking for Marks Details...');
        // Navigate to marks
        try {
            await page.waitForFunction(
                () => {
                    const links = Array.from(document.querySelectorAll('a'));
                    return links.some(link => link.textContent.includes('Marks Details'));
                },
                { timeout: 3000 }
            );

            await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const marks = links.find(a => a.textContent.includes('Marks Details'));
                if (marks) marks.click();
            });

            // Wait for navigation after clicking Marks Details with shorter timeout
            await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 });
            await delay(200);

            await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const overall = links.find(a => a.textContent.includes('Overall Marks - Semwise'));
                if (overall) overall.click();
            });

            // Wait for navigation after clicking Overall Marks with shorter timeout
            await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 });
        } catch (e) {
            debug(`Failed to navigate to marks: ${e.message}`);
            throw new Error('Could not access marks section');
        }

        await delay(500);

        debug('Selecting semester...');
        // Select semester based on the parameter
        try {
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

            // Use page.evaluate instead of page.$x
            const semBtn = await page.evaluate((semText) => {
                const inputs = Array.from(document.querySelectorAll('input'));
                const btn = inputs.find(input => input.value && input.value.includes(semText));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            }, semesterText);

            if (semBtn) {
                await delay(500);
            } else {
                throw new Error(`Semester button not found for ${semesterText}`);
            }
        } catch (e) {
            debug(`Failed to select semester: ${e.message}`);
            throw new Error(`Could not select semester: ${e.message}`);
        }

        debug('Waiting for CGPA element...');
        try {
            // Wait for the CGPA element to be present
            await page.waitForSelector('#cpStudCorner_lblFinalCGPA', { timeout: 5000 });

            // Extract CGPA
            cgpa = await page.evaluate(() => {
                const cgpaElement = document.getElementById('cpStudCorner_lblFinalCGPA');
                return cgpaElement ? cgpaElement.innerText.trim() : '-';
            });

            debug(`Found CGPA: ${cgpa}`);

            if (!cgpa || cgpa === '-') {
                throw new Error('CGPA not found');
            }

            // Take a screenshot of the final result
            screenshots.push({
                name: `${roll}_${semester}_cgpa`,
                data: await page.screenshot({ encoding: 'base64' })
            });
        } catch (e) {
            debug(`Failed to extract CGPA: ${e.message}`);
            throw new Error('Could not retrieve CGPA');
        }

        debug('Process completed successfully');
        res.json({ cgpa, screenshots, studentName });
    } catch (err) {
        debug(`Error: ${err.message}`);
        res.status(500).json({ error: err.message });
    } finally {
        if (browser) {
            await browser.close();
            debug('Browser closed');
        }
    }
});

app.listen(5000, () => console.log('Backend running on port 5000')); 