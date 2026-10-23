import apiClient, { DEFAULT_BASE_URL } from "../api/AxiosClient";
import { apiEndpoints } from "../api/ApiEndpoints";
import useAuthStore from "../store/authStore";

/**
 * Production API client
 * Base URL:
 * https://rebs-control-panal-k3qzq.ondigitalocean.app
 *
 * Authorization tokens are attached automatically by apiClient.
 */

/**
 * 1. Company Platform Login
 * POST /platform/company/login
 */
export const loginCompany = async (credentials) => {
  const response = await apiClient.post(apiEndpoints.login, credentials);

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
 * POST /platform/company/logout
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
 * POST /tenant/password/forgot
 */
const FORGOT_PASSWORD_EMAIL = "aswin100396@gmail.com";

export const forgotPassword = async () => {
  try {
    const response = await apiClient.post(
      apiEndpoints.forgotPassword || "/tenant/password/forgot",
      { email: FORGOT_PASSWORD_EMAIL },
    );

    return response?.data || response;
  } catch (error) {
    const data = error?.data || error?.response?.data;

    const message =
      (typeof data?.detail === "string" && data.detail) ||
      data?.message ||
      error?.message ||
      "Could not send reset email.";

    throw new Error(message);
  }
};

/**
 * 4. Get all tenant enquiries
 * GET /tenant/enquiry/list-all
 */
export const getEnquiries = async (params = {}) => {
  const response = await apiClient.get(apiEndpoints.getEnquiries, { params });

  return response?.data || response;
};

/**
 * 5. Reset Password
 */
export const resetPassword = async ({ token, new_password }) => {
  try {
    const response = await apiClient.post(apiEndpoints.resetPassword, {
      token,
      new_password,
    });

    return response?.data || response;
  } catch (error) {
    const data = error?.data || error?.response?.data;

    const message =
      (typeof data?.detail === "string" && data.detail) ||
      data?.message ||
      error?.message ||
      "This reset link is invalid or has expired.";

    throw new Error(message);
  }
};

export { DEFAULT_BASE_URL };
