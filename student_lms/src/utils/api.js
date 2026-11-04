/**
 * API Client for Student LMS
 */

const API_BASE = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("student_token") || localStorage.getItem("token") || "";
}

export function setAuthSession(token, user, student) {
  if (token) localStorage.setItem("student_token", token);
  if (user) localStorage.setItem("student_user", JSON.stringify(user));
  if (student) localStorage.setItem("student_profile", JSON.stringify(student));
}

export function clearAuthSession() {
  localStorage.removeItem("student_token");
  localStorage.removeItem("student_user");
  localStorage.removeItem("student_profile");
}

export function getStoredSession() {
  try {
    const token = getToken();
    const user = JSON.parse(localStorage.getItem("student_user") || "null");
    const student = JSON.parse(localStorage.getItem("student_profile") || "null");
    return { token, user, student };
  } catch {
    return { token: "", user: null, student: null };
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body !== "string" && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  // If body is FormData, delete Content-Type to let browser set boundary
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || `HTTP Error ${response.status}: ${response.statusText}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  get: (endpoint, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return request(url, { method: "GET" });
  },
  post: (endpoint, body) => request(endpoint, { method: "POST", body }),
  put: (endpoint, body) => request(endpoint, { method: "PUT", body }),
  patch: (endpoint, body) => request(endpoint, { method: "PATCH", body }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
  upload: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/materials/upload", {
      method: "POST",
      body: formData,
    });
  },
};

export default api;
