// src/services/SubscriptionService.js
import { cloudflareClient, CLOUDFLARE_URL } from "../api/AxiosClient";
import { apiEndpoints } from "../api/ApiEndpoints";
import { DEBUG } from "./MasterService";

/**
 * The response interceptor in AxiosClient already returns response.data,
 * so these functions return the API payload directly.
 *
 * Every function accepts an optional axios `config` as its last argument.
 * Pass { silent: true } to stop the interceptor showing its own toasts.
 *
 * Console logging: request, response and errors are logged in development,
 * or in production when VITE_DEBUG_LOGS=true is set. Errors always log.
 */

const TAG = "[Subscription]";

const request = async (label, payload, run) => {
  if (DEBUG) {
    console.log(`${TAG} → ${label}`, {
      baseURL: CLOUDFLARE_URL,
      payload: payload ?? "(none)",
    });
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
      status: err?.status ?? "no response (network / CORS / tunnel down)",
      message: err?.message,
      data: err?.data,
    });
    throw err;
  }
};

/* ───────────── Tenant subscriptions ───────────── */

// GET /tenant/subscription/tenant-info
// -> { companies: [ { company_id, company_name, ..., subscription: {...} } ] }
export const getTenantSubscriptions = async (config = {}) =>
  request("GET subscription/tenant-info", null, () =>
    cloudflareClient.get(apiEndpoints.tenantSubscriptionInfo, config),
  );