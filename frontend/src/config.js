export const VITE_API_URL =
    import.meta.env.MODE === "production"
        ? "https://cgpa-fetcher.onrender.com"
        : "http://localhost:5000";
