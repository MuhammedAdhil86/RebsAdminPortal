export const apiEndpoints = {
  // Logo
  getLogo: "/REBS/",

  // Authentication & Session
  login: "/platform/company/login",
  logout: "/platform/company/logout",

  // Tenant Password Management
  forgotPassword: "/tenant/password/forgot",
  resetPassword: "/tenant/password/reset",
  getEnquiries: "/tenant/enquiry/list-all",

  // Master data: Country
  countryList: "/teqbae/country/list",
  countryAdd: "/teqbae/country/add", // PUT: id 0 = create, id > 0 = update
  countryDelete: (id) => `/teqbae/country/delete/${id}`,

  // Master data: Organisation type
  organisationTypeList: "/teqbae/organisation-type/list",
  organisationTypeAdd: "/teqbae/organisation-type/add", // PUT
  organisationTypeDelete: (id) => `/teqbae/organisation-type/delete/${id}`,

  // Master data: Service
  serviceList: "/teqbae/service/list",
  serviceAdd: "/teqbae/service/add", // PUT
  serviceDelete: (id) => `/teqbae/service/delete/${id}`,

  
  // Master data: Billing period
  billingPeriodList: "/teqbae/billing-period/list",
  billingPeriodAdd: "/teqbae/billing-period/add", // PUT
  billingPeriodDelete: (id) => `/teqbae/billing-period/delete/${id}`,

// Master data: Subscription Plan
  subscriptionPlanList: "/teqbae/subscription-plan/list",
  subscriptionPlanAdd: "/teqbae/subscription-plan/add",
  subscriptionPlanDelete: (id) => `/teqbae/subscription-plan/delete/${id}`,

  // Master data: Plan Service
  planServiceList: "/teqbae/plan-service/list",
  planServiceAdd: "/teqbae/plan-service/add",
  planServiceDelete: (id) => `/teqbae/plan-service/delete/${id}`,

};

export default apiEndpoints;