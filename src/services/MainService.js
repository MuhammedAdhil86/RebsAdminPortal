import { cloudflareClient, CLOUDFLARE_URL } from "../api/AxiosClient";
import { apiEndpoints } from "../api/ApiEndpoints";

/**
 * MainService: shared helpers + staff (employee) endpoints.
 *
 * The response interceptor in AxiosClient already returns response.data,
 * so these functions return the API payload directly.
 *
 * Every function accepts an optional axios `config` as its last argument:
 *   - { signal }        cancel the request (AbortController)
 *   - { silent: true }  stop the interceptor showing its own error toast
 *
 * Logging: enabled in development, or in production when
 * VITE_DEBUG_LOGS=true. Real errors always log; cancelled requests never
 * log as failures.
 */

/* ───────────── Debug logging ───────────── */

export const DEBUG =
  import.meta.env.DEV || import.meta.env.VITE_DEBUG_LOGS === "true";

const TAG = "[HRMS]";

// True when the request was cancelled on purpose (AbortController, React
// StrictMode remount, unmount, navigation).
export const isCanceled = (err) =>
  err?.code === "ERR_CANCELED" ||
  err?.name === "CanceledError" ||
  err?.name === "AbortError" ||
  err?.message === "canceled";

export const request = async (label, payload, run) => {
  if (DEBUG) {
    console.log(`${TAG} → ${label}`, {
      baseURL: CLOUDFLARE_URL,
      payload: payload ?? "(none)",
    });
  }

  try {
    const response = await run();
    if (DEBUG) console.log(`${TAG} ← ${label} OK`, response);
    return response;
  } catch (err) {
    // Cancelled on purpose: not a failure, rethrow quietly
    if (isCanceled(err)) {
      if (DEBUG) console.log(`${TAG} ⊘ ${label} canceled`);
      throw err;
    }

    console.error(`${TAG} ✗ ${label} FAILED`, {
      status: err?.status ?? "no response (network / CORS / tunnel down)",
      message: err?.message,
      data: err?.data,
    });
    throw err;
  }
};

/* ───────────── Validation helpers ───────────── */

const toId = (value, label) => {
  const n = Number(value);
  if (value == null || value === "" || !Number.isFinite(n)) {
    throw new Error(`A valid ${label} is required.`);
  }
  return n;
};

/* ───────────── Staff ───────────── */

/**
 * List staff (employees) of a company.
 *
 * GET /hrms/service/list-users?company_id=1
 *
 * @param {number|string} companyId  Required, the tenant's company_id.
 * @param {import("axios").AxiosRequestConfig & { silent?: boolean }} [config]
 * @returns {Promise<{
 *   success: boolean,
 *   total: number,
 *   users: Array<{
 *     name: string,
 *     uuid: string,
 *     department: string,
 *     designation: string,
 *     branch: string
 *   }>
 * }>}
 * @throws {Error} on invalid input, network failure or `success: false`.
 */
export const getStaffList = async (companyId, config = {}) => {
  const id = toId(companyId, "company id");
  const { params, ...restConfig } = config;

  const body = await request("GET service/list-users", { company_id: id }, () =>
    cloudflareClient.get(apiEndpoints.ListUsers, {
      ...restConfig,
      // company_id comes last so callers can't override it by accident
      params: { ...(params || {}), company_id: id },
    }),
  );

  if (body?.success === false) {
    throw new Error(body?.message || "Failed to load staff.");
  }

  const users = Array.isArray(body?.users) ? body.users : [];

  return {
    success: true,
    total: Number.isFinite(body?.total) ? body.total : users.length,
    users,
  };
};

// Backward-compatible alias so existing imports keep working
export const getemployeeUsers = getStaffList;
