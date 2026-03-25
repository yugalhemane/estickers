// services/api.js
import axios from "axios";

// ----------------- Local Storage Helpers -----------------
const getToken = () => localStorage.getItem("token");
const setToken = (token) => localStorage.setItem("token", token);
const removeToken = () => localStorage.removeItem("token");

const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};
const setUser = (user) => localStorage.setItem("user", JSON.stringify(user));
const removeUser = () => localStorage.removeItem("user");

// ----------------- Auth Helpers -----------------
export const isAuthenticated = () => !!getToken();
export const getCurrentUser = () => getUser();
export const logout = () => {
  removeToken();
  removeUser();
  window.location.href = "/";
};

// ----------------- Backend Connection -----------------
export const testBackendConnection = async () => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseUrl}/api/ping`);
    return response.ok;
  } catch (error) {
    console.error("Backend connection test failed:", error);
    return false;
  }
};

// ----------------- Core API Request -----------------
const apiRequest = async (url, options = {}) => {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const fullUrl = baseUrl + url;

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const res = await fetch(fullUrl, config);
    // console.log("Response status:", res.status);

    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch {
      // console.log("Failed to parse JSON response:", text);
    }

    if (!res.ok) {
      if (res.status === 401) {
        logout();
        throw new Error("Session expired. Please login again.");
      }
      throw new Error(json.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    return json;
  } catch (error) {
    console.error("API request failed:", error);
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("ERR_CONNECTION_REFUSED")
    ) {
      throw new Error("Backend server is not running.");
    }
    throw error;
  }
};

// ----------------- File Upload API Request -----------------
const apiRequestWithFile = async (url, formData) => {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const fullUrl = baseUrl + url;

  const config = {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  };

  const res = await fetch(fullUrl, config);
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {}

  if (!res.ok) {
    if (res.status === 401) {
      logout();
      throw new Error("Session expired. Please login again.");
    }
    throw new Error(json.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  return json;
};

// ----------------- Shortcuts -----------------
export const apiPost = (url, data) =>
  apiRequest(url, { method: "POST", body: JSON.stringify(data) });

export const apiGet = (url) => apiRequest(url, { method: "GET" });

export const apiPut = (url, data) =>
  apiRequest(url, { method: "PUT", body: JSON.stringify(data) });

export const apiDelete = (url) => apiRequest(url, { method: "DELETE" });

// ----------------- Services -----------------
export const authService = {
  // OTP-based authentication (original)
  signup: (userData) => apiPost("/api/auth/signup", userData),
  login: (email) => apiPost("/api/auth/login", { email }),
  verifyOtp: async (email, otp) => {
    const response = await apiPost("/api/auth/verify-otp", { email, otp });
    if (response.success && response.token) {
      setToken(response.token);
      setUser(response.user);
    }
    return response;
  },
  resendOtp: (email) => apiPost("/api/auth/resend-otp", { email }),

  // Password-based authentication
  loginWithPassword: async (email, password) => {
    const response = await apiPost("/api/auth/login-password", {
      email,
      password,
    });
    if (response.success && response.token) {
      setToken(response.token);
      setUser(response.user);
    }
    return response;
  },

  // Google OAuth authentication
  googleLogin: async (googleData) => {
    const response = await apiPost("/api/auth/google-login", googleData);
    if (response.success && response.token) {
      setToken(response.token);
      setUser(response.user);
    }
    return response;
  },

  // Utility functions
  logout: () => logout(),
  getCurrentUser: () => getCurrentUser(),
  isAuthenticated: () => isAuthenticated(),
};

export const stickerService = {
  getAllStickers: (category, options = {}) => {
    const params = new URLSearchParams();
    if (category && category !== "All") params.set("category", category);
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.sort) params.set("sort", options.sort);
    if (options.q) params.set("q", options.q);
    const query = params.toString();
    const url = `/api/stickers${query ? `?${query}` : ""}`;
    return apiGet(url);
  },

  getStickerById: (stickerId) => apiGet(`/api/stickers/${stickerId}`),
  addSticker: (stickerData, imageFile) => {
    const formData = new FormData();
    formData.append("title", stickerData.title);
    formData.append("description", stickerData.description || "");
    formData.append("price", stickerData.price);
    if (imageFile) formData.append("stickerImage", imageFile);
    return apiRequestWithFile("/api/stickers/create", formData);
  },
  deleteSticker: async (stickerId) => {
    const token = getToken();
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const fullUrl = `${baseUrl}/api/stickers/${stickerId}`;

    const res = await fetch(fullUrl, {
      method: "DELETE",
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    });

    if (!res.ok) {
      if (res.status === 403) throw new Error("Admin access only");
      throw new Error(`Failed to delete sticker (HTTP ${res.status})`);
    }
    return await res.json();
  },
  updateSticker: async (stickerId, stickerData, imageFile) => {
    const formData = new FormData();
    if (stickerData.title) formData.append("title", stickerData.title);
    if (stickerData.description !== undefined)
      formData.append("description", stickerData.description);
    if (stickerData.price) formData.append("price", stickerData.price);
    if (imageFile) formData.append("stickerImage", imageFile);

    const token = getToken();
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const fullUrl = `${baseUrl}/api/stickers/${stickerId}`;

    const res = await fetch(fullUrl, {
      method: "PUT",
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });

    if (!res.ok) {
      if (res.status === 403) throw new Error("Admin access only");
      throw new Error(`Failed to update sticker (HTTP ${res.status})`);
    }
    return await res.json();
  },
};

export const cartService = {
  addToCart: (stickerId, quantity) =>
    apiPost("/api/cart/add", { stickerId, quantity }),
  removeFromCart: (stickerId) => apiPost("/api/cart/remove", { stickerId }),
  updateCartQuantity: (stickerId, quantity) =>
    apiPost("/api/cart/update", { stickerId, quantity }),
  getCart: () => apiGet("/api/cart"),
};

export const orderService = {
  placeOrder: (orderData) => {
    // Map frontend keys → backend schema
    const mappedData = {
      items: orderData.items.map((item) => ({
        sticker: item.sticker,
        quantity: item.quantity,
      })),
      total: orderData.totalPrice, // ✅ backend expects "total"
      address: {
        street: orderData.shippingAddress.street,
        city: orderData.shippingAddress.city,
        state: orderData.shippingAddress.state,
        postalCode: orderData.shippingAddress.postalCode,
        country: orderData.shippingAddress.country,
      },
      paymentMethod: orderData.paymentMethod || "COD",
    };

    return apiPost("/api/orders", mappedData);
  },

  getUserOrders: () => apiGet("/api/orders/me"), // ✅ matches backend
  getAllOrders: () => apiGet("/api/orders"), // ✅ admin only
  updateOrderStatus: (orderId, status) =>
    apiPut(`/api/orders/${orderId}/status`, { status }),
};

export default {
  auth: authService,
  stickers: stickerService,
  cart: cartService,
  orders: orderService,
};
