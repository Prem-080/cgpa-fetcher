import { chromium } from "playwright";
import { sessionStore } from "../cache/sessionStore.js";
import { debug, isPageValid } from "../utils/index.js";

export async function getOrCreateSession(roll, semester) {

    // Check for an existing session
    const existingSession = sessionStore.get(roll);

    // If the requested semester is already cached, return cached data
    if (
        existingSession &&
        existingSession.semester === semester &&
        existingSession.screenshots?.length > 0
    ) {
        existingSession.lastUsed = Date.now();

        return {
            cached: true,
            data: {
                cgpa: existingSession.cgpa,
                studentName: existingSession.studentName,
                screenshots: existingSession.screenshots,
                sgpaValue: existingSession.sgpaValue
            }
        };
    }

    let browser = null;
    let page = null;

    let needsNewScreenshot = true;
    let screenshots = [];

    try {

        debug(`🚀 Fetching session for ${roll}`);

        // -------------------------------
        // Reuse existing browser if valid
        // -------------------------------
        if (existingSession?.browser && existingSession?.page) {

            debug("♻️ Existing browser found");

            const valid = await isPageValid(existingSession.page);

            if (valid) {

                browser = existingSession.browser;
                page = existingSession.page;

                screenshots = existingSession.screenshots ?? [];

                needsNewScreenshot =
                    existingSession.semester !== semester ||
                    screenshots.length === 0;

                if (existingSession.semester !== semester) {
                    screenshots = [];
                }

                existingSession.lastUsed = Date.now();

                debug("✅ Browser session reused");
            } else {

                debug("❌ Existing session invalid");

                try {
                    await existingSession.page?.close();
                    await existingSession.browser?.close();
                } catch (err) {
                    debug(`Cleanup failed: ${err.message}`);
                }

                sessionStore.delete(roll);
            }
        }

        // -------------------------------
        // Create new browser if required
        // -------------------------------
        if (!browser) {

            debug("🆕 Launching new browser");

            browser = await chromium.launch({
                headless: true,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--disable-web-security",
                    "--disable-extensions",
                    "--no-first-run",
                    "--disable-default-apps",
                    "--disable-sync",
                    "--aggressive-cache-discard"
                ]
            });

            const context = await browser.newContext({
                viewport: {
                    width: 1024,
                    height: 720
                },
                locale: "en-US",
                userAgent:
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
            });

            page = await context.newPage();

            // Block unnecessary resources
            await page.route("**/*", route => {

                const type = route.request().resourceType();
                const url = route.request().url();

                if (
                    [
                        "image",
                        "stylesheet",
                        "font",
                        "media",
                        "websocket"
                    ].includes(type)
                ) {
                    return route.abort();
                }

                if (
                    type === "script" &&
                    !url.includes("tkrcetautonomous")
                ) {
                    return route.abort();
                }

                route.continue();
            });

            sessionStore.set(roll, {
                browser,
                page,
                cgpa: null,
                studentName: null,
                sgpaValue: null,
                screenshots: [],
                semester: null,
                lastUsed: Date.now()
            });

            needsNewScreenshot = true;
            screenshots = [];
        }

        return {
            cached: false,
            browser,
            page,
            existingSession,
            needsNewScreenshot,
            screenshots
        };

    } catch (err) {

        if (browser) {
            try {
                await browser.close();
            } catch { }
        }

        throw err;
    }
}