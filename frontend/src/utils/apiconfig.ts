// src/config/apiConfig.ts

// Default to local dev if no env variable is set
const getBaseUrl = (): string => {
  // For Vite: use import.meta.env
  const apiUrl = import.meta.env?.VITE_API_URL;

  // For Create React App: use process.env
  // const apiUrl = process.env.REACT_APP_API_URL;

  // Check instanceKey for local multi-tenant setup, fallback to env or local
  const instanceKey = localStorage.getItem("instanceKey") || "shared";
  
  // If env variable exists (cloud deployment), use it
  if (apiUrl) {
    return apiUrl; // e.g., "https://your-api.cloud-provider.com"
  }

  // Local dev fallback with instanceKey
  return instanceKey === "shared" 
    ? "http://192.168.1.9:8000/" // Default local dev URL
    : `http://${instanceKey}.192.168.1.9:8000/`;
};

export const baseUrl = getBaseUrl();