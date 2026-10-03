import { cloudflareClient, CLOUDFLARE_URL } from "../api/AxiosClient";
import { apiEndpoints } from "../api/ApiEndpoints";

/**
 * The response interceptor in AxiosClient already returns response.data,
 * so these functions return the API payload directly.
 *
 * The backend uses one PUT "add" endpoint for both create and update:
 *   id: 0  -> create
 *   id > 0 -> update
 *
 * Every function accepts an optional axios `config` as its last argument.
 * Pass { silent: true } to stop the interceptor showing its own toasts.
 *
 * Console logging: request, response and errors are logged in development,
 * or in production when VITE_DEBUG_LOGS=true is set. Errors always log.
 */

/* ───────────── Debug logging ───────────── */

// Logs in development, or in any build with VITE_DEBUG_LOGS=true
export const DEBUG =
  import.meta.env.DEV || import.meta.env.VITE_DEBUG_LOGS === "true";

const TAG = "[MasterData]";

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

/* ───────────── Country ───────────── */

// GET /teqbae/country/list
export const getCountries = async (config = {}) =>
  request("GET country/list", null, () =>
    cloudflareClient.get(apiEndpoints.countryList, config),
  );

// PUT /teqbae/country/add  { id: 0, name, code }
export const createCountry = async ({ name, code }, config = {}) => {
  const body = { id: 0, name, code };
  return request("PUT country/add (create)", body, () =>
    cloudflareClient.put(apiEndpoints.countryAdd, body, config),
  );
};

// PUT /teqbae/country/add  { id, name, code }
export const updateCountry = async ({ id, name, code }, config = {}) => {
  const body = { id, name, code };
  return request("PUT country/add (update)", body, () =>
    cloudflareClient.put(apiEndpoints.countryAdd, body, config),
  );
};

// DELETE /teqbae/country/delete/:id
export const deleteCountry = async (id, config = {}) =>
  request("DELETE country/delete", { id }, () =>
    cloudflareClient.delete(apiEndpoints.countryDelete(id), config),
  );

/* ───────────── Organisation type ───────────── */

// GET /teqbae/organisation-type/list
export const getOrganisationTypes = async (config = {}) =>
  request("GET organisation-type/list", null, () =>
    cloudflareClient.get(apiEndpoints.organisationTypeList, config),
  );

// PUT /teqbae/organisation-type/add  { id: 0, name }
export const createOrganisationType = async ({ name }, config = {}) => {
  const body = { id: 0, name };
  return request("PUT organisation-type/add (create)", body, () =>
    cloudflareClient.put(apiEndpoints.organisationTypeAdd, body, config),
  );
};

// PUT /teqbae/organisation-type/add  { id, name }
export const updateOrganisationType = async ({ id, name }, config = {}) => {
  const body = { id, name };
  return request("PUT organisation-type/add (update)", body, () =>
    cloudflareClient.put(apiEndpoints.organisationTypeAdd, body, config),
  );
};

// DELETE /teqbae/organisation-type/delete/:id
export const deleteOrganisationType = async (id, config = {}) =>
  request("DELETE organisation-type/delete", { id }, () =>
    cloudflareClient.delete(apiEndpoints.organisationTypeDelete(id), config),
  );

/* ───────────── Service ───────────── */

// GET /teqbae/service/list
export const getServices = async (config = {}) =>
  request("GET service/list", null, () =>
    cloudflareClient.get(apiEndpoints.serviceList, config),
  );

// PUT /teqbae/service/add  { id: 0, name }
export const createService = async ({ name }, config = {}) => {
  const body = { id: 0, name };
  return request("PUT service/add (create)", body, () =>
    cloudflareClient.put(apiEndpoints.serviceAdd, body, config),
  );
};

// PUT /teqbae/service/add  { id, name }
export const updateService = async ({ id, name }, config = {}) => {
  const body = { id, name };
  return request("PUT service/add (update)", body, () =>
    cloudflareClient.put(apiEndpoints.serviceAdd, body, config),
  );
};

// DELETE /teqbae/service/delete/:id
export const deleteService = async (id, config = {}) =>
  request("DELETE service/delete", { id }, () =>
    cloudflareClient.delete(apiEndpoints.serviceDelete(id), config),
  );

/* ───────────── Billing period ───────────── */

// GET /teqbae/billing-period/list
export const getBillingPeriods = async (config = {}) =>
  request("GET billing-period/list", null, () =>
    cloudflareClient.get(apiEndpoints.billingPeriodList, config),
  );

// PUT /teqbae/billing-period/add  { id: 0, code, name, months, description }
export const createBillingPeriod = async (
  { code, name, months, description },
  config = {},
) => {
  const body = { id: 0, code, name, months: Number(months), description };
  return request("PUT billing-period/add (create)", body, () =>
    cloudflareClient.put(apiEndpoints.billingPeriodAdd, body, config),
  );
};

// PUT /teqbae/billing-period/add  { id, code, name, months, description }
export const updateBillingPeriod = async (
  { id, code, name, months, description },
  config = {},
) => {
  const body = { id, code, name, months: Number(months), description };
  return request("PUT billing-period/add (update)", body, () =>
    cloudflareClient.put(apiEndpoints.billingPeriodAdd, body, config),
  );
};

// DELETE /teqbae/billing-period/delete/:id
export const deleteBillingPeriod = async (id, config = {}) =>
  request("DELETE billing-period/delete", { id }, () =>
    cloudflareClient.delete(apiEndpoints.billingPeriodDelete(id), config),
  );

  /* ───────────── Subscription Plan ───────────── */

// GET /teqbae/subscription-plan/list
export const getSubscriptionPlans = async (config = {}) =>
  request("GET subscription-plan/list", null, () =>
    cloudflareClient.get(apiEndpoints.subscriptionPlanList, config),
  );

// PUT /teqbae/subscription-plan/add (create: id 0)
export const createSubscriptionPlan = async (
  { code, name, description, is_active, allow_plan_extension, plan_extension_days },
  config = {},
) => {
  const body = {
    id: 0,
    code,
    name,
    description: description || "",
    is_active: Boolean(is_active),
    allow_plan_extension: Boolean(allow_plan_extension),
    plan_extension_days: Number(plan_extension_days || 0),
  };
  return request("PUT subscription-plan/add (create)", body, () =>
    cloudflareClient.put(apiEndpoints.subscriptionPlanAdd, body, config),
  );
};

// PUT /teqbae/subscription-plan/add (update: id > 0)
export const updateSubscriptionPlan = async (
  { id, code, name, description, is_active, allow_plan_extension, plan_extension_days },
  config = {},
) => {
  const body = {
    id,
    code,
    name,
    description: description || "",
    is_active: Boolean(is_active),
    allow_plan_extension: Boolean(allow_plan_extension),
    plan_extension_days: Number(plan_extension_days || 0),
  };
  return request("PUT subscription-plan/add (update)", body, () =>
    cloudflareClient.put(apiEndpoints.subscriptionPlanAdd, body, config),
  );
};

// DELETE /teqbae/subscription-plan/delete/:id
export const deleteSubscriptionPlan = async (id, config = {}) =>
  request("DELETE subscription-plan/delete", { id }, () =>
    cloudflareClient.delete(apiEndpoints.subscriptionPlanDelete(id), config),
  );

/* ───────────── Plan Service ───────────── */

// GET /teqbae/plan-service/list
export const getPlanServices = async (config = {}) =>
  request("GET plan-service/list", null, () =>
    cloudflareClient.get(apiEndpoints.planServiceList, config),
  );

// PUT /teqbae/plan-service/add (create: id 0)
export const createPlanService = async ({ plan_id, service_id }, config = {}) => {
  const body = { id: 0, plan_id: Number(plan_id), service_id: Number(service_id) };
  return request("PUT plan-service/add (create)", body, () =>
    cloudflareClient.put(apiEndpoints.planServiceAdd, body, config),
  );
};

// PUT /teqbae/plan-service/add (update: id > 0)
export const updatePlanService = async ({ id, plan_id, service_id }, config = {}) => {
  const body = { id, plan_id: Number(plan_id), service_id: Number(service_id) };
  return request("PUT plan-service/add (update)", body, () =>
    cloudflareClient.put(apiEndpoints.planServiceAdd, body, config),
  );
};

// DELETE /teqbae/plan-service/delete/:id
export const deletePlanService = async (id, config = {}) =>
  request("DELETE plan-service/delete", { id }, () =>
    cloudflareClient.delete(apiEndpoints.planServiceDelete(id), config),
  );


  /* ───────────── Plan Service Pricing ───────────── */

// GET /teqbae/plan-service-pricing/list
export const getPlanServicePricings = async (config = {}) =>
  request("GET plan-service-pricing/list", null, () =>
    cloudflareClient.get(apiEndpoints.planServicePricingList, config),
  );

// PUT /teqbae/plan-service-pricing/add (create: id 0)
export const createPlanServicePricing = async (
  {
    plan_service_id,
    billing_period_id,
    included_users,
    base_amount,
    additional_user_price,
  },
  config = {},
) => {
  const body = {
    id: 0,
    plan_service_id: Number(plan_service_id),
    billing_period_id: Number(billing_period_id),
    included_users: Number(included_users),
    base_amount: Number(base_amount),
    additional_user_price: Number(additional_user_price),
  };
  return request("PUT plan-service-pricing/add (create)", body, () =>
    cloudflareClient.put(apiEndpoints.planServicePricingAdd, body, config),
  );
};

// PUT /teqbae/plan-service-pricing/add (update: id > 0)
export const updatePlanServicePricing = async (
  {
    id,
    plan_service_id,
    billing_period_id,
    included_users,
    base_amount,
    additional_user_price,
  },
  config = {},
) => {
  const body = {
    id: Number(id),
    plan_service_id: Number(plan_service_id),
    billing_period_id: Number(billing_period_id),
    included_users: Number(included_users),
    base_amount: Number(base_amount),
    additional_user_price: Number(additional_user_price),
  };
  return request("PUT plan-service-pricing/add (update)", body, () =>
    cloudflareClient.put(apiEndpoints.planServicePricingAdd, body, config),
  );
};

// DELETE /teqbae/plan-service-pricing/delete/:id
export const deletePlanServicePricing = async (id, config = {}) =>
  request("DELETE plan-service-pricing/delete", { id }, () =>
    cloudflareClient.delete(apiEndpoints.planServicePricingDelete(id), config),
  );