/**
 * Centralized API endpoints configuration for all backend REST and WebSocket routes.
 */
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8082";

// AUTH ENDPOINTS
export const endpoints = {
  SIGNUP_API: BASE_URL + "/auth/signup",
  LOGIN_API: BASE_URL + "/auth/login",
};

// RUN ENDPOINTS
export const runEndpoints = {
  RUN_API: BASE_URL + "/run",
};

// COLLABORATION ENDPOINTS
export const collabEndpoints = {
  WS_URL: BASE_URL + "/ws-compiler",
  JOIN_ROOM_API: BASE_URL + "/collab/join",
  CREATE_ROOM_API: BASE_URL + "/collab/info",
  ROOM_DETAILS_API: BASE_URL + "/collab/room",
  UPDATE_PERMISSION_API: BASE_URL + "/collab/permission",
};

// AI ENDPOINTS
export const aiEndpoints = {
  ASK_AI_API: BASE_URL + "/api/ai/ask",
};
