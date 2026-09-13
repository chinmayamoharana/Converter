import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes timeout for large documents
});

export default api;
