export const VITE_API_URL =
    import.meta.env.MODE === "production"
        ? "https://cgpa-fetcher.up.railway.app"
        : "http://localhost:5000";
