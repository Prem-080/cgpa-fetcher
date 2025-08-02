export const VITE_API_URL =
    import.meta.env.MODE === "production"
        ? "https://cgpa-fetcher-production.up.railway.com"
        : "http://localhost:5000";
