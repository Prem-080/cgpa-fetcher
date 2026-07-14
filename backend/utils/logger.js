// Enhanced debug with timing
const debug = (msg) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DEBUG] ${msg}`);
    // Removed console.error to prevent Railway from treating debug messages as errors
};
export default debug;