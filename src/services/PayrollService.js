import apiClient, { DEFAULT_BASE_URL } from "../api/AxiosClient";
import { apiEndpoints } from "../api/ApiEndpoints";
import { DEBUG, isCanceled } from "./PolicyService";

/**
 * Same conventions as PolicyService:
 *
 * The response interceptor in AxiosClient already returns response.data,
 * so these functions return the API payload directly.
 *
 * Every function accepts an optional axios `config` as its last argument.
 * Pass { silent: true } to stop the interceptor showing its own toasts.
 * Pass { signal } (AbortController) to cancel a request.
 *
 * Add these to ApiEndpoints:
 *   ListSalaryTemplates:    "/hrms/service/list/salary-templates",
 *   AllocateSalaryTemplate: "/hrms/service/allocate/salary-templates",
 */

const TAG = "[HRMS]";

// Same request logger as PolicyService (request, response and errors)
const request = async (label, payload, run) => {
  if (DEBUG) {
    console.log(`${TAG} → ${label}`, {
      baseURL: DEFAULT_BASE_URL,
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
      status: err?.status ?? "no response (network / CORS / server down)",
      message: err?.message,
      data: err?.data,
    });
    throw err;
  }
};

// Validates an id and returns it as a number
const toId = (value, label) => {
  const n = Number(value);
  if (value == null || value === "" || !Number.isFinite(n)) {
    throw new Error(`A valid ${label} is required.`);
  }
  return n;
};

// "2026-10-20" -> "2026-10-20T00:00:00Z" (no timezone shifting)
const toUtcMidnight = (value) => {
  const day = String(value ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error("A valid date is required (YYYY-MM-DD).");
  }
  return `${day}T00:00:00Z`;
};

/* ───────────── Salary templates ───────────── */

/**
 * GET /hrms/service/list/salary-templates?platform_id=1
 * (platform id = company id)
 * -> { success, message, data: { items: [{
 *      id, company_id, name, description, annual_ctc, status,
 *      created_at, updated_at,
 *      mappings: [{ id, template_id, component_id,
 *                   calculation_type: "percentage_ctc" | "flat", value }]
 *    }], total } }
 *
 * Always resolves to { success: true, total, templates } with `templates`
 * an array. Throws on invalid input, network failure or `success: false`.
 */
export const getSalaryTemplates = async (companyId, config = {}) => {
  const id = toId(companyId, "company id");
  const { params, ...restConfig } = config;

  const body = await request(
    "GET service/list/salary-templates",
    { platform_id: id },
    () =>
      apiClient.get(apiEndpoints.ListSalaryTemplates, {
        ...restConfig,
        // platform_id (= company id) comes last so callers can't override it
        params: { ...(params || {}), platform_id: id },
      }),
  );

  if (body?.success === false) {
    throw new Error(body?.message || "Failed to load salary templates.");
  }

  // Expected: { data: { items, total } }. Also tolerate { items, total },
  // { data: [...] } or a bare array.
  const payload = body?.data ?? body;
  const templates = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    success: true,
    total: Number.isFinite(payload?.total) ? payload.total : templates.length,
    templates,
  };
};

/* ───────────── Allocate salary template ───────────── */

/**
 * POST /hrms/service/allocate/salary-templates
 *
 * Single -> { company_id, template_id, user_id,  effective_from, effective_to? }
 * Bulk   -> { company_id, template_id, user_ids, effective_from, effective_to? }
 *
 * companyId: sent as `company_id`
 * effectiveFrom / effectiveTo: "YYYY-MM-DD" (converted to "YYYY-MM-DDT00:00:00Z")
 * userId / userIds: the staff `uuid` from getStaffList
 * bulk: true -> sends `user_ids`, false -> sends `user_id`
 *       (decided by `bulk`, not by the array length)
 */
export const allocateSalaryTemplate = async (
  {
    companyId,
    templateId,
    userId,
    userIds,
    effectiveFrom,
    effectiveTo,
    bulk = false,
  },
  config = {},
) => {
  // Accept userIds (array) or userId (single), then clean and de-duplicate
  const ids = [
    ...new Set(
      (Array.isArray(userIds) ? userIds : [userIds ?? userId])
        .map((v) => String(v ?? "").trim())
        .filter(Boolean),
    ),
  ];

  if (ids.length === 0) throw new Error("A valid staff id is required.");

  const body = {
    company_id: toId(companyId, "company id"),
    template_id: toId(templateId, "template id"),
    effective_from: toUtcMidnight(effectiveFrom),
  };

  if (effectiveTo) {
    body.effective_to = toUtcMidnight(effectiveTo);
    if (body.effective_to < body.effective_from) {
      throw new Error("Effective to cannot be before effective from.");
    }
  }

  // Single -> user_id, Bulk -> user_ids
  if (bulk) {
    body.user_ids = ids;
  } else {
    body.user_id = ids[0];
  }

  const res = await request(
    "POST service/allocate/salary-templates",
    body,
    () => apiClient.post(apiEndpoints.AllocateSalaryTemplate, body, config),
  );

  if (res?.success === false) {
    throw new Error(res?.message || "Failed to allocate salary template.");
  }
  return res;
};
