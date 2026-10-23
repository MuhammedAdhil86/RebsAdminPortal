import apiClient, { DEFAULT_BASE_URL } from "../api/AxiosClient";
import { apiEndpoints } from "../api/ApiEndpoints";

/**
 * The response interceptor in AxiosClient already returns response.data,
 * so these functions return the API payload directly.
 *
 * Every function accepts an optional axios `config` as its last argument.
 * Pass { silent: true } to stop the interceptor showing its own toasts.
 * Pass { signal } (AbortController) to cancel a request.
 *
 * Console logging: request, response and errors are logged in development,
 * or in production when VITE_DEBUG_LOGS=true is set. Real errors always log;
 * cancelled requests are never logged as failures.
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

// Number(...) that falls back to 0 instead of NaN for empty / invalid input
const toNumber = (value, fallback = 0) => {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
};

// Validates an id and returns it as a number
const toId = (value, label) => {
  const n = Number(value);
  if (value == null || value === "" || !Number.isFinite(n)) {
    throw new Error(`A valid ${label} is required.`);
  }
  return n;
};

/* ───────────── Default leave policy payload ───────────── */

export const DEFAULT_LEAVE_POLICY = {
  name: "",
  code: "",
  leave_type: "Paid",
  color: "#4CAF50",
  description: "",
  accrual_method: "monthly",
  employee_accrues: 0,
  prorate_for_new_joiners: true,
  postpone_accrual: false,
  postpone_accrual_value: 0,
  postpone_accrual_period: "",
  reset_leave_balance: true,
  carry_forward: false,
  carry_forward_limit: 0,
  encash_leave: false,
  encash_limit: 0,
  allow_negative_balance: false,
  consider_negative_balance: "",
  allow_past_leave: true,
  past_leave_limit: 0,
  allow_future_leave: true,
  future_leave_limit: 0,
  reset_leave_period: "yearly",
  staff_ids: [],
  criteria: {
    allocate_all: true,
    branch_id: null,
    department_id: null,
    designation_id: null,
    gender: null,
  },
};

/* ───────────── HRMS Users (staff list) ───────────── */

/**
 * GET /hrms/service/list-users?company_id=1
 * -> { success, total, users: [{ name, uuid, department, designation, branch }] }
 *
 * Always resolves to { success: true, total, users } with `users` an array.
 * Throws on invalid input, network failure or `success: false`.
 */
export const getemployeeUsers = async (companyId, config = {}) => {
  const id = toId(companyId, "company id");
  const { params, ...restConfig } = config;

  const body = await request("GET service/list-users", { company_id: id }, () =>
    apiClient.get(apiEndpoints.ListUsers, {
      ...restConfig,
      // company_id comes last so callers can't override it by accident
      params: { ...(params || {}), company_id: id },
    }),
  );

  if (body?.success === false) {
    throw new Error(body?.message || "Failed to load employees.");
  }

  const users = Array.isArray(body?.users) ? body.users : [];

  return {
    success: true,
    total: Number.isFinite(body?.total) ? body.total : users.length,
    users,
  };
};

// Alias so "staff list" imports also work
export const getStaffList = getemployeeUsers;

// Backward-compatible alias for the old name
export const getHrmsUsers = getemployeeUsers;

/* ───────────── Bulk add users (CSV) ───────────── */

export const BULK_USER_CSV_HEADERS = [
  "first_name",
  "last_name",
  "nick_name",
  "email",
  "ph_no",
  "basic_salary",
  "salary_period",
  "account_holder_name",
  "account_number",
  "ifsc",
  "bank_name",
  "bank_branch",
];

// Sample CSV text, e.g. for a "Download template" button
export const BULK_USER_CSV_TEMPLATE =
  `${BULK_USER_CSV_HEADERS.join(",")}\n` +
  "Rahul,Sharma,Rahul,rahul.sharma@example.com,9876543210,25000,monthly," +
  "Rahul Sharma,123456789012,HDFC0001234,HDFC Bank,Kozhikode Main\n";

// POST /hrms/service/bulk-add/users  (multipart/form-data)
// fields: company_id, file (.csv)
// Pass { onUploadProgress } in config to show upload progress.
export const bulkAddUsers = async (companyId, file, config = {}) => {
  if (!file) throw new Error("Please choose a CSV file to upload.");

  const formData = new FormData();
  formData.append("company_id", String(companyId));
  formData.append("file", file);

  // Log only file name/size: the CSV contains bank details
  return request(
    "POST service/bulk-add/users",
    { company_id: companyId, file: file.name, size: file.size },
    () =>
      apiClient.post(apiEndpoints.hrmsBulkAddUsers, formData, {
        ...config,
        headers: {
          ...(config.headers || {}),
          "Content-Type": "multipart/form-data",
        },
      }),
  );
};

/* ───────────── Leave Policy ───────────── */

// GET /hrms/service/list/leave-policies?company_id=1
// -> { success, policies: [...] }
export const getLeavePolicies = async (companyId, config = {}) =>
  request("GET service/list/leave-policies", { company_id: companyId }, () =>
    apiClient.get(apiEndpoints.hrmsLeavePolicyList, {
      ...config,
      params: { company_id: companyId, ...(config.params || {}) },
    }),
  );

// POST /hrms/service/add/leave-policy  { company_id, policy: {...} }

/* ───────────── Shifts ───────────── */

// GET /hrms/service/list/shifts?company_id=1
export const getShifts = async (companyId, config = {}) =>
  request("GET service/list/shifts", { company_id: companyId }, () =>
    apiClient.get(apiEndpoints.hrmsShiftList, {
      ...config,
      params: { company_id: companyId, ...(config.params || {}) },
    }),
  );

export const allocateStaffsToLeavePolicy = async (
  { companyId, leavePolicyId, staffIds },
  config = {},
) => {
  const ids = Array.isArray(staffIds)
    ? [...new Set(staffIds.map((id) => String(id).trim()).filter(Boolean))]
    : [];
  if (ids.length === 0) {
    throw new Error("Select at least one staff member.");
  }

  const body = {
    platform_id: toId(companyId, "company id"),
    leave_policy_id: toId(leavePolicyId, "leave policy id"),
    staff_ids: ids,
  };

  const res = await request(
    "POST service/allocate-staffs/leave-policy",
    body,
    () => apiClient.post(apiEndpoints.AllocateLeavePolicyStaffs, body, config),
  );

  if (res?.success === false) {
    throw new Error(
      res?.message || "Failed to allocate staff to leave policy.",
    );
  }
  return res;
};
/**
 * GET /hrms/service/fetch-shifts?company_id=1
 * -> { success, total, shifts: [{
 *      id, shift_name, shift_code, shift_colour, company_id,
 *      is_cross_shift, is_default, created_at, allocated_employees,
 *      policy_count, remarks: { String, Valid },
 *      policies: [{ id, policy_name, start_time, end_time, working_hours, ... }]
 *    }] }
 *
 * Always resolves to { success: true, total, shifts } with `shifts` an array.
 * Throws on invalid input, network failure or `success: false`.
 */
export const fetchShifts = async (companyId, config = {}) => {
  const id = toId(companyId, "company id");
  const { params, ...restConfig } = config;

  const body = await request(
    "GET service/fetch-shifts",
    { company_id: id },
    () =>
      apiClient.get(apiEndpoints.FetchShifts, {
        ...restConfig,
        // company_id comes last so callers can't override it by accident
        params: { ...(params || {}), company_id: id },
      }),
  );

  if (body?.success === false) {
    throw new Error(body?.message || "Failed to load shifts.");
  }

  const shifts = Array.isArray(body?.shifts) ? body.shifts : [];

  return {
    success: true,
    total: Number.isFinite(body?.total) ? body.total : shifts.length,
    shifts,
  };
};

/**
 * GET /hrms/service/list/shift-allocations?company_id=1&user_id=100525&month=2026-11
 * -> { success, shifts: [{ date, user_id, employee_name, shift_id,
 *                         shift_name, is_cross_shift, is_default }] }
 * month format: "YYYY-MM"
 */
export const getShiftAllocations = async (
  { companyId, userId, month },
  config = {},
) =>
  request(
    "GET service/list/shift-allocations",
    { company_id: companyId, user_id: userId, month },
    () =>
      apiClient.get(apiEndpoints.ShiftList, {
        ...config,
        params: {
          company_id: companyId,
          user_id: userId,
          month,
          ...(config.params || {}),
        },
      }),
  );

/* ───────────── Allocate shift ───────────── */

// "2026-10-20" -> "2026-10-20T00:00:00Z" (no timezone shifting)
const toUtcMidnight = (value) => {
  const day = String(value ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error("A valid date is required (YYYY-MM-DD).");
  }
  return `${day}T00:00:00Z`;
};

/**
 * POST /hrms/service/allocate-shift
 * { platform_id, shift_id, staff_id, from_date, to_date }
 *
 * companyId: sent as `platform_id` (platform id = company id)
 * fromDate / toDate: "YYYY-MM-DD" (converted to "YYYY-MM-DDT00:00:00Z")
 * staffId: the staff `uuid` from getStaffList (same value used as user_id
 *          in getShiftAllocations)
 */
export const allocateShift = async (
  { companyId, shiftId, staffId, fromDate, toDate },
  config = {},
) => {
  const body = {
    platform_id: toId(companyId, "company id"),
    shift_id: toId(shiftId, "shift id"),
    staff_id: String(staffId ?? "").trim(),
    from_date: toUtcMidnight(fromDate),
    to_date: toUtcMidnight(toDate),
  };

  if (!body.staff_id) throw new Error("A valid staff id is required.");
  if (body.to_date < body.from_date) {
    throw new Error("End date cannot be before start date.");
  }

  const res = await request("POST service/allocate-shift", body, () =>
    apiClient.post(apiEndpoints.AllocateShift, body, config),
  );

  if (res?.success === false) {
    throw new Error(res?.message || "Failed to allocate shift.");
  }
  return res;
};
