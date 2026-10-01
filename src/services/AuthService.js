import apiClient, { DEFAULT_BASE_URL } from "../api/AxiosClient";
import { apiEndpoints } from "../api/ApiEndpoints";
import useAuthStore from "../store/authStore";

/**
 * 1. Company Platform Login
 * Target: [ACTIVE_BASE_URL]/platform/company/login
 * Request:  { email, password }
 * Response: { access_token, refresh_token, expires_at }
 */
export const loginCompany = async (credentials) => {
  const response = await apiClient.post(apiEndpoints.login, credentials);

  // Unpack payload whether returned directly or nested under data
  const payload = response?.data || response || {};
  const { access_token, refresh_token, expires_at } = payload;

  if (access_token) {
    useAuthStore.getState().login({
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: expires_at,
      email: credentials.email,
    });
  }

  return payload;
};

/**
 * 2. Company Platform Logout
 * Target: [ACTIVE_BASE_URL]/platform/company/logout
 * Uses Bearer <access_token> automatically attached by apiClient
 */
export const logoutCompany = async () => {
  try {
    await apiClient.post(apiEndpoints.logout);
  } catch (error) {
    console.error("Logout request failed on server:", error);
  } finally {
    useAuthStore.getState().logout();
  }
};

/**
 * 3. Tenant Forgot Password
 * Target: [ACTIVE_BASE_URL]/tenant/password/forgot
 * Request: { email }
 */
export const forgotPassword = async (payload) => {
  return await apiClient.post(apiEndpoints.forgotPassword, payload);
};
/**
 * Get all tenant enquiries
 * GET /tenant/enquiry/list-all
 * Headers: Authorization: Bearer <accessToken> (automatically injected)
 * @param {Object} [params] - Optional query parameters (e.g., { page: 1, limit: 10, search: "" })
 */
export const getEnquiries = async (params = {}) => {
  const response = await apiClient.get(apiEndpoints.getEnquiries, { params });
  return response?.data || response;
};
/**
 * 4. Tenant Reset Password
 * Target: [ACTIVE_BASE_URL]/tenant/password/reset
 * Request: { token, new_password }
 */
export const resetPassword = async (payload) => {
  return await apiClient.post(apiEndpoints.resetPassword, payload);
};

export { DEFAULT_BASE_URL };