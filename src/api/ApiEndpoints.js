export const apiEndpoints = {
  // Authentication & Session
  login: "/platform/company/login",
  logout: "/platform/company/logout",

  // Tenant Password Management
  forgotPassword: "/tenant/password/forgot",
  resetPassword: "/tenant/password/reset",
  getEnquiries: "/tenant/enquiry/list-all",
};

export default apiEndpoints;