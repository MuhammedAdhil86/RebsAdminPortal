import apiClient from "../api/AxiosClient";
import { apiEndpoints } from "../api/ApiEndpoints";

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
      const current = byService.get(s.id) || { id: s.id, name: s.name, count: 0 };
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