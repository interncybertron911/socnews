/**
 * Centralized Frontend Configuration
 * Change values in the .env file instead of hardcoding here.
 */

export const config = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
};
