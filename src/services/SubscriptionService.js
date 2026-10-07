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
  request("GET subscription/tenant-info", null, () => {
    return cloudflareClient.get(apiEndpoints.tenantSubscriptionInfo, config);
  });

// GET /tenant/subscription/active-tenants
// -> [ { company_id, company_name, contact_person, email, phone_number, address, organisation_type, status } ]
export const getActiveTenants = async (config = {}) =>
  request("GET subscription/active-tenants", null, () =>
    cloudflareClient.get(apiEndpoints.activeTenants, config)
  );

// DELETE /tenant/subscription/delete/{company_id}
export const deleteTenantSubscription = async (companyId, config = {}) =>
  request(`DELETE subscription/delete/${companyId}`, { companyId }, () =>
    cloudflareClient.delete(
      typeof apiEndpoints.deleteTenantSubscription === "function"
        ? apiEndpoints.deleteTenantSubscription(companyId)
        : `${apiEndpoints.deleteTenantSubscription}/${companyId}`,
      config
    )
  );
// PATCH /tenant/subscription/{subscription_id}/update-status
// payload: { status: "ACTIVE" | "SUSPENDED" }
export const updateSubscriptionStatus = async (
  subscriptionId,
  status,
  config = {}
) => {
  const payload = { status };
  return request(
    `PATCH subscription/${subscriptionId}/update-status`,
    payload,
    () =>
      cloudflareClient.patch(
        typeof apiEndpoints.updateSubscriptionStatus === "function"
          ? apiEndpoints.updateSubscriptionStatus(subscriptionId)
          : `${apiEndpoints.updateSubscriptionStatus}/${subscriptionId}/update-status`,
        payload,
        config
      )
  );
};

// POST /subscriptions/{subscription_id}/renew
export const renewSubscription = async (
  subscriptionId,
  options = {},
  config = {}
) => {
  // send only the fields that were actually provided
  const payload = {};
  [
    "use_current_pricing",
    "billing_period_id",
    "extend_users",
    "user_extensions",
  ].forEach((key) => {
    if (options[key] !== undefined) payload[key] = options[key];
  });

  return request(
    `POST subscriptions/${subscriptionId}/renew`,
    payload,
    () =>
      cloudflareClient.post(
        typeof apiEndpoints.renewSubscription === "function"
          ? apiEndpoints.renewSubscription(subscriptionId)
          : `${apiEndpoints.renewSubscription}/${subscriptionId}/renew`,
        payload,
        config
      )
  );
};


 
// GET plan-options?billing_period_id=3
// -> [ { id, name, services: [ { id, name } ] } ]
export const getPlanOptions = async (billingPeriodId, config = {}) =>
  request(
    `GET subscriptions/plan-options?billing_period_id=${billingPeriodId}`,
    { billing_period_id: billingPeriodId },
    () =>
      cloudflareClient.get(apiEndpoints.planOptions, {
        ...config,
        params: { billing_period_id: billingPeriodId },
      })
  );
 
// POST /tenant/subscription/{subscription_id}/change-plan
// payload: { new_plan_id, billing_period_id, service_ids, carry_over_user_extensions }
export const changeSubscriptionPlan = async (
  subscriptionId,
  options = {},
  config = {}
) => {
  const payload = {
    new_plan_id: options.new_plan_id,
    billing_period_id: options.billing_period_id,
    service_ids: options.service_ids || [],
    carry_over_user_extensions: options.carry_over_user_extensions ?? true,
  };
 
  return request(
    `POST subscription/${subscriptionId}/change-plan`,
    payload,
    () =>
      cloudflareClient.post(
        typeof apiEndpoints.changeSubscriptionPlan === "function"
          ? apiEndpoints.changeSubscriptionPlan(subscriptionId)
          : `${apiEndpoints.changeSubscriptionPlan}/${subscriptionId}/change-plan`,
        payload,
        config
      )
  );
};
 