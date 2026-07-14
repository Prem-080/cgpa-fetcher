import { sessionStore } from '../cache/sessionStore.js';
import {debug} from '../utils/index.js';
export default async function updateSession(roll, cgpa, semester, studentName, screenshots, sgpaValue, existingSession, needsNewScreenshot) {
     // Update session store with new data
        const session = sessionStore.get(roll);
        if (session) {
            session.cgpa = cgpa;
            session.studentName = studentName;
            session.semester = semester;
            session.lastUsed = Date.now();
            session.screenshots = screenshots;
            session.sgpaValue = sgpaValue;
            debug('✅ Session updated with data');
        }
}