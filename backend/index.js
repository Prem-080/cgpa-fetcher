import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const app = express();

// Environment variables
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',');

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://cgpa-fetcher.vercel.app',
            'https://cgpa-fetcher-prem-080s-projects.vercel.app',
            'https://cgpa-fetcher-git-main-prem-080s-projects.vercel.app',
            'https://cgpa-fetcher-7c93752lh-prem-080s-projects.vercel.app'
        ];

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Root route - API documentation
app.get('/', (req, res) => {
    res.json({
        status: 'API is running',
        endpoints: {
            '/': {
                method: 'GET',
                description: 'API documentation and health check'
            },
            '/fetch-grade': {
                method: 'POST',
                description: 'Fetch CGPA for a student',
                body: {
                    roll: 'Student roll number (required)',
                    semester: 'Semester selection (required)'
                },
                example: {
                    request: {
                        roll: '20XX1A0XXX',
                        semester: 'II_II'
                    },
                    response: {
                        cgpa: '8.5',
                        studentName: 'Student Name',
                        screenshots: ['...']
                    }
                }
            }
        },
        frontend: 'https://cgpa-fetcher.vercel.app'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const debug = (msg) => console.log(`[DEBUG] ${msg}`);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
        });

        const page = await browser.newPage();

        // Enable console log from browser
        page.on('console', msg => {
            if (!msg.text().includes('autocomplete')) {
                debug(`Browser Console: ${msg.text()}`);
            }
        });

        debug('Navigating to login page...');
        await page.goto('https://www.tkrcetautonomous.org/Login.aspx', {
            waitUntil: ['domcontentloaded', 'networkidle0', 'load'],
            timeout: 30000
        });

        // Wait for page to be fully loaded
        await sleep(2000);

        debug('Looking for Logins link...');
        // Try multiple selector strategies for "Logins"
        try {
            await page.waitForFunction(
                () => {
                    const links = Array.from(document.querySelectorAll('a'));
                    return links.some(link => link.textContent.includes('Logins'));
                },
                { timeout: 10000 }
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

        await sleep(2000);
        debug('Looking for Student Login link...');

        // Try to find and click "Student Login"
        try {
            await page.waitForFunction(
                () => {
                    const links = Array.from(document.querySelectorAll('a'));
                    return links.some(link => link.textContent.includes('Student Login'));
                },
                { timeout: 10000 }
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
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
        debug('Entering credentials...');

        // Login form with autocomplete attributes
        await page.waitForSelector('#txtUserId', { visible: true, timeout: 10000 });

        // Add autocomplete attributes to the form fields
        await page.evaluate(() => {
            const userIdField = document.getElementById('txtUserId');
            const passwordField = document.getElementById('txtPwd');
            if (userIdField) userIdField.setAttribute('autocomplete', 'username');
            if (passwordField) passwordField.setAttribute('autocomplete', 'current-password');
        });

        await page.type('#txtUserId', roll, { delay: 100 });
        await page.type('#txtPwd', roll, { delay: 100 });
        await page.click('#btnLogin');

        await sleep(2000);

        // Start name extraction asynchronously
        const namePromise = (async () => {
            try {
                const name = await page.evaluate(() => {
                    const nameElement = document.getElementById('lblStudName');
                    return nameElement ? nameElement.innerText.trim() : '';
                });
                if (name) {
                    debug(`Found student name: ${name}`);
                    return name;
                }
                debug('No student name found');
                return '';
            } catch (e) {
                debug(`Error finding student name: ${e.message}`);
                return '';
            }
        })();

        debug('Looking for Marks Details...');
        // Navigate to marks
        try {
            await page.waitForFunction(
                () => {
                    const links = Array.from(document.querySelectorAll('a'));
                    return links.some(link => link.textContent.includes('Marks Details'));
                },
                { timeout: 10000 }
            );

            await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const marks = links.find(a => a.textContent.includes('Marks Details'));
                if (marks) marks.click();
            });

            await sleep(2000);

            await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const overall = links.find(a => a.textContent.includes('Overall Marks - Semwise'));
                if (overall) overall.click();
            });
        } catch (e) {
            debug(`Failed to navigate to marks: ${e.message}`);
            throw new Error('Could not access marks section');
        }

        await sleep(2000);

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

            // Check if the semester results exist
            const semesterExists = await page.evaluate((semText) => {
                const inputs = Array.from(document.querySelectorAll('input[type="submit"]'));
                return inputs.some(input => input.value && input.value.includes(semText));
            }, semesterText);

            if (!semesterExists) {
                throw new Error(`Results for ${semesterMap[semester]} are not available yet`);
            }

            const [semBtn] = await page.$x(`//input[contains(@value, '${semesterText}')]`);
            if (semBtn) {
                await semBtn.click();
                await sleep(2000);
            } else {
                throw new Error(`Semester button not found for ${semesterText}`);
            }

            // Verify if we got the correct semester page
            const correctSemester = await page.evaluate((semText) => {
                const pageContent = document.body.innerText;
                return pageContent.includes(`You are Seeing - ${semText}`);
            }, semesterText);

            if (!correctSemester) {
                throw new Error(`Unable to load results for ${semesterMap[semester]}`);
            }

        } catch (e) {
            debug(`Failed to select semester: ${e.message}`);
            throw new Error(`Could not access semester results: ${e.message}`);
        }

        debug('Waiting for CGPA element...');
        try {
            // Wait for the CGPA element to be present
            await page.waitForSelector('#cpStudCorner_lblFinalCGPA', { timeout: 10000 });

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
                data: await page.screenshot({
                    encoding: 'base64',
                    fullPage: false,
                    type: 'png',
                    omitBackground: false
                })
            });
        } catch (e) {
            debug(`Failed to extract CGPA: ${e.message}`);
            throw new Error('Could not retrieve CGPA');
        }

        // Wait for name extraction to complete and get the result
        const studentName = await namePromise;

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

app.listen(PORT, () => console.log(`Backend running on port ${PORT} in ${NODE_ENV} mode`)); 