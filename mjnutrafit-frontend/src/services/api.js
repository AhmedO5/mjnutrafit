const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

class ApiService {
  getAuthToken() {
    return localStorage.getItem("token");
  }

  async request(endpoint, options = {}) {
    const token = this.getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText || "An error occurred",
      }));
      throw new Error(error.message || error.emailOrPassword || "Request failed");
    }

    return response.json();
  }

  // Auth
  async register(data) {
    return this.request("/users/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data) {
    return this.request("/users/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request("/users/currentUser", {
      method: "GET",
    });
  }

  async refreshToken(refreshToken, userId, email) {
    return this.request("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({
        id: userId,
        email,
        refreshToken,
      }),
    });
  }

  async updateProfile(data) {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request("/users/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append("profilePicture", file);
    
    const token = this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users/upload-picture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText || "An error occurred",
      }));
      throw new Error(error.message || "Upload failed");
    }

    return response.json();
  }

  // Plans
  async getPlans() {
    return this.request("/plans", { method: "GET" });
  }

  async getCurrentPlan() {
    return this.request("/plans/current", { method: "GET" });
  }

  async createPlan(data) {
    return this.request("/plans", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePlan(id, data) {
    return this.request(`/plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Progress
  async submitProgressLog(data) {
    return this.request("/progress", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getProgressLogs() {
    return this.request("/progress", { method: "GET" });
  }

  async getProgressLogById(id) {
    return this.request(`/progress/${id}`, { method: "GET" });
  }

  // Coach
  async getPendingClients() {
    return this.request("/coach/pending-clients", { method: "GET" });
  }

  async approveClient(clientId) {
    return this.request(`/coach/approve-client/${clientId}`, {
      method: "POST",
    });
  }

  async rejectClient(clientId) {
    return this.request(`/coach/reject-client/${clientId}`, {
      method: "POST",
    });
  }

  async getMyClients() {
    return this.request("/coach/my-clients", { method: "GET" });
  }

  async reviewProgressLog(logId, action, feedback) {
    return this.request(`/coach/review-log/${logId}`, {
      method: "POST",
      body: JSON.stringify({ action, feedback }),
    });
  }

  // Dashboard
  async getClientDashboard() {
    return this.request("/dashboard/client", { method: "GET" });
  }

  async getCoachDashboard() {
    return this.request("/dashboard/coach", { method: "GET" });
  }
}

export const apiService = new ApiService();
