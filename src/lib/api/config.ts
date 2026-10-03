// The backend serves the API under /api/v1 (global prefix + URI versioning).
// `VITE_API_BASE_URL` in .env is authoritative; this matches it.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1";
