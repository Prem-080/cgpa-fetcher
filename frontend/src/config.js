export const VITE_API_URL =
    import.meta.env.MODE === "production"
        ? "https://cgpa-fetcher.up.railway.app"
        : "http://127.0.0.1:5000";
