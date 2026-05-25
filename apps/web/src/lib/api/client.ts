import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await apiClient.post('/api/v1/auth/refresh');
        const { accessToken } = response.data.data;
        localStorage.setItem('access_token', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<{ data: T; success: boolean }>(url, { params }).then((r) => r.data.data),

  post: <T>(url: string, data?: unknown) =>
    apiClient.post<{ data: T; success: boolean }>(url, data).then((r) => r.data),

  put: <T>(url: string, data?: unknown) =>
    apiClient.put<{ data: T; success: boolean }>(url, data).then((r) => r.data.data),

  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<{ data: T; success: boolean }>(url, data).then((r) => r.data.data),

  delete: <T>(url: string) =>
    apiClient.delete<{ data: T; success: boolean }>(url).then((r) => r.data.data),
};

export default apiClient;
