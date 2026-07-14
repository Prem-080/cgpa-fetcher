import { sessionStore } from "../cache/sessionStore.js";
import { debug } from "./index.js";

const cleanup = async (roll) => {
    const session = sessionStore.get(roll);
    if (!session) {
        return;
    }
    try {
        await session.page?.close();
        await session.context?.close();
        await session.browser?.close();
    } catch (e) {
        debug(`⚠️ Error during cleanup: ${e && e.message ? e.message : String(e)}`);
        try { console.error('Error during cleanup:', e); } catch (_) { /* ignore */ }
    }
    sessionStore.delete(roll);
    debug('🧹 Cleaned up session due to error');
}
export default cleanup;