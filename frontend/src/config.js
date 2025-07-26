// Use environment variable in production, fallback to localhost in development
export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://cgpa-fetcher.onrender.com'  // Correct Render URL
  : 'http://localhost:5000';