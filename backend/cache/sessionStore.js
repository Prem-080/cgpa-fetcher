import {debug} from '../utils/index.js';

export const sessionStore = new Map(); // Key: roll number, Value: { browser, page, lastUsed, cgpa, studentName, screenshots, semester }

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
}, 5 * 60 * 1000); 