import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import {
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  getOrganisationTypes,
  createOrganisationType,
  updateOrganisationType,
  deleteOrganisationType,
  getServices,
  createService,
  updateService,
  deleteService,
  getBillingPeriods,
  createBillingPeriod,
  updateBillingPeriod,
  deleteBillingPeriod,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getPlanServices,
  createPlanService,
  updatePlanService,
  deletePlanService,
  getPlanServicePricings,
  createPlanServicePricing,
  updatePlanServicePricing,
  deletePlanServicePricing,
  DEBUG,
} from "../../services/MasterService";

import CountryTab from "./country_tab";
import OrganisationTypeTab from "./organisation_type_tab";
import ServiceTab from "./service_tab";
import BillingPeriodTab from "./Billing_Period_Tab";
import SubscriptionPlanTab from "./subscription_plan_tab";
import PlanServiceTab from "./Plan_Service_Tab";
import PlanServicePricingTab from "./plan_service_pricing_tab";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";

/* Console logging (development, or VITE_DEBUG_LOGS=true) */
const log = (...args) => {
  if (DEBUG) console.log("[MasterDataTab]", ...args);
};

/* ------------------------------------------------------------------ */
/*  All master data APIs are handled here (parent) and passed down    */
/*  to each tab as an `api` prop.                                     */
/*                                                                    */
/*  silent: true -> the panel shows its own toasts (no duplicates)    */
/* ------------------------------------------------------------------ */

const SILENT = { silent: true };

const APIS = {
  // GET /teqbae/country/list
  // PUT /teqbae/country/add  (id 0 = create, id > 0 = update)
  // DELETE /teqbae/country/delete/:id
  country: {
    list: () => getCountries(SILENT),
    create: (payload) => createCountry(payload, SILENT),
    update: (payload) => updateCountry(payload, SILENT),
    remove: (id) => deleteCountry(id, SILENT),
  },

  // GET /teqbae/organisation-type/list
  // PUT /teqbae/organisation-type/add
  // DELETE /teqbae/organisation-type/delete/:id
  organisationType: {
    list: () => getOrganisationTypes(SILENT),
    create: (payload) => createOrganisationType(payload, SILENT),
    update: (payload) => updateOrganisationType(payload, SILENT),
    remove: (id) => deleteOrganisationType(id, SILENT),
  },

  // GET /teqbae/service/list
  // PUT /teqbae/service/add
  // DELETE /teqbae/service/delete/:id
  service: {
    list: () => getServices(SILENT),
    create: (payload) => createService(payload, SILENT),
    update: (payload) => updateService(payload, SILENT),
    remove: (id) => deleteService(id, SILENT),
  },

  // GET /teqbae/billing-period/list
  // PUT /teqbae/billing-period/add
  // DELETE /teqbae/billing-period/delete/:id
  billingPeriod: {
    list: () => getBillingPeriods(SILENT),
    create: (payload) => createBillingPeriod(payload, SILENT),
    update: (payload) => updateBillingPeriod(payload, SILENT),
    remove: (id) => deleteBillingPeriod(id, SILENT),
  },

  // GET /teqbae/subscription-plan/list
  // PUT /teqbae/subscription-plan/add
  // DELETE /teqbae/subscription-plan/delete/:id
  subscriptionPlan: {
    list: () => getSubscriptionPlans(SILENT),
    create: (payload) => createSubscriptionPlan(payload, SILENT),
    update: (payload) => updateSubscriptionPlan(payload, SILENT),
    remove: (id) => deleteSubscriptionPlan(id, SILENT),
  },

  // GET /teqbae/plan-service/list
  // PUT /teqbae/plan-service/add
  // DELETE /teqbae/plan-service/delete/:id
  planService: {
    list: () => getPlanServices(SILENT),
    create: (payload) => createPlanService(payload, SILENT),
    update: (payload) => updatePlanService(payload, SILENT),
    remove: (id) => deletePlanService(id, SILENT),
  },

  // GET /teqbae/plan-service-pricing/list
  // PUT /teqbae/plan-service-pricing/add
  // DELETE /teqbae/plan-service-pricing/delete/:id
  planServicePricing: {
    list: () => getPlanServicePricings(SILENT),
    create: (payload) => createPlanServicePricing(payload, SILENT),
    update: (payload) => updatePlanServicePricing(payload, SILENT),
    remove: (id) => deletePlanServicePricing(id, SILENT),
  },
};

/* Tab definitions */
const TABS = [
  { key: "country", label: "Countries", Component: CountryTab },
  {
    key: "organisationType",
    label: "Organisation Types",
    Component: OrganisationTypeTab,
  },
  { key: "service", label: "Services", Component: ServiceTab },
  {
    key: "billingPeriod",
    label: "Billing Periods",
    Component: BillingPeriodTab,
  },
  {
    key: "subscriptionPlan",
    label: "Subscription Plans",
    Component: SubscriptionPlanTab,
  },
  {
    key: "planService",
    label: "Plan Services",
    Component: PlanServiceTab,
  },
  {
    key: "planServicePricing",
    label: "Plan Service Pricings",
    Component: PlanServicePricingTab,
  },
];

/* ------------------------------------------------------------------ */
/*  Master data shell                                                 */
/* ------------------------------------------------------------------ */

export default function MasterDataTab({ onCancel }) {
  const [activeKey, setActiveKey] = useState(TABS[0].key);
  const [deleteRequest, setDeleteRequest] = useState(null);

  const active = TABS.find((t) => t.key === activeKey) || TABS[0];
  const ActiveTab = active.Component;

  useEffect(() => {
    log("tab opened", activeKey);
  }, [activeKey]);

  // Tabs ask for delete confirmation through the `requestDelete` prop
  const requestDelete = useCallback((request) => {
    log("requestDelete", { singular: request.singular, name: request.name });
    setDeleteRequest(request);
  }, []);

  const closeDelete = useCallback(() => {
    log("delete modal closed");
    setDeleteRequest(null);
  }, []);

  return (
    <div className="px-4 sm:px-6 flex flex-col gap-6">
      {/* Sub-header banner */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black text-white text-xs flex items-center justify-center shrink-0">
              MD
            </div>
            <div>
              <p className="text-gray-900 font-medium">
                Master Data Configuration
              </p>
              <p className="text-[11px] text-gray-500">
                Manage system-wide reference datasets, entity types, and
                classification lists
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon icon="mdi:close" className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>

        {/* Sub-category pills */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-100">
          {TABS.map((tab) => {
            const isSelected = tab.key === activeKey;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setDeleteRequest(null);
                  setActiveKey(tab.key);
                }}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                  isSelected
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active tab */}
      <ActiveTab
        key={active.key}
        api={APIS[active.key]}
        requestDelete={requestDelete}
      />

      {/* Delete confirmation modal */}
      {deleteRequest && (
        <DeleteConfirmModal request={deleteRequest} onClose={closeDelete} />
      )}
    </div>
  );
}
