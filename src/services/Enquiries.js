import apiClient from "../api/AxiosClient";
import { apiEndpoints } from "../api/ApiEndpoints";

/**
 * Authorization tokens are attached automatically by apiClient, and its
 * response interceptor already returns response.data.
 *
 * Console logging: request, response and errors are logged in development,
 * or in production when VITE_DEBUG_LOGS=true is set. Errors always log.
 */

/* ───────────── Debug logging ───────────── */

const DEBUG = import.meta.env.DEV || import.meta.env.VITE_DEBUG_LOGS === "true";

const TAG = "[Enquiry]";

const request = async (label, payload, run) => {
  if (DEBUG) {
    console.log(`${TAG} → ${label}`, payload ?? "(none)");
  }

  try {
    const response = await run();

    if (DEBUG) {
      console.log(`${TAG} ← ${label} OK`, response);
    }

    return response;
  } catch (err) {
    // err is the Error created by the AxiosClient response interceptor
    console.error(`${TAG} ✗ ${label} FAILED`, {
      status: err?.status ?? "no response (network / CORS / server down)",
      message: err?.message,
      data: err?.data,
    });
    throw err;
  }
};

/* ───────────── Tenant Enquiries ───────────── */

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
 * Enquiry dashboard summary (per-service counts + paid/unpaid totals).
 * Built from getEnquiries, so no extra backend endpoint is needed.
 * Returns:
 * {
 *   total: 12,
 *   paid: 5,
 *   unpaid: 7,
 *   services: [{ id: 1, name: "HRMS", count: 8 }, { id: 2, name: "CRM", count: 4 }]
 * }
 */
export const getEnquiryServiceSummary = async (params = {}) => {
  const res = await getEnquiries(params);
  const list = Array.isArray(res) ? res : res?.items || [];

  const byService = new Map();
  let paid = 0;

  list.forEach((enquiry) => {
    if (enquiry.is_paid) paid += 1;
    (enquiry.services || []).forEach((s) => {
      const current = byService.get(s.id) || {
        id: s.id,
        name: s.name,
        count: 0,
      };
      current.count += 1;
      byService.set(s.id, current);
    });
  });

  return {
    total: list.length,
    paid,
    unpaid: list.length - paid,
    services: [...byService.values()].sort((a, b) => b.count - a.count),
  };
};

// DELETE /tenant/enquiry/delete/{enquiry_id}
export const deleteEnquiry = async (enquiryId, config = {}) => {
  if (enquiryId === undefined || enquiryId === null || enquiryId === "") {
    throw new Error("A valid enquiry id is required.");
  }

  return request(`DELETE enquiry/delete/${enquiryId}`, { enquiryId }, () =>
    apiClient.delete(
      typeof apiEndpoints.deleteEnquiry === "function"
        ? apiEndpoints.deleteEnquiry(enquiryId)
        : `${apiEndpoints.deleteEnquiry}/${enquiryId}`,
      config,
    ),
  );
};
