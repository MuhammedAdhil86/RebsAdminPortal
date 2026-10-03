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
  DEBUG,
} from "../../services/MasterService";

import CountryTab from "./country_tab";
import OrganisationTypeTab from "./organisation_type_tab";
import ServiceTab from "./service_tab";
import BillingPeriodTab from "./Billing_Period_Tab";
import SubscriptionPlanTab from "./subscription_plan_tab";
import PlanServiceTab from "./Plan_Service_Tab";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";

/* Console logging (development, or VITE_DEBUG_LOGS=true) */
const log = (...args) => {
  if (DEBUG) console.log("[MasterDataTab]", ...args);
};

const SILENT = { silent: true };

const APIS = {
  country: {
    list: () => getCountries(SILENT),
    create: (payload) => createCountry(payload, SILENT),
    update: (payload) => updateCountry(payload, SILENT),
    remove: (id) => deleteCountry(id, SILENT),
  },
  organisationType: {
    list: () => getOrganisationTypes(SILENT),
    create: (payload) => createOrganisationType(payload, SILENT),
    update: (payload) => updateOrganisationType(payload, SILENT),
    remove: (id) => deleteOrganisationType(id, SILENT),
  },
  service: {
    list: () => getServices(SILENT),
    create: (payload) => createService(payload, SILENT),
    update: (payload) => updateService(payload, SILENT),
    remove: (id) => deleteService(id, SILENT),
  },
  billingPeriod: {
    list: () => getBillingPeriods(SILENT),
    create: (payload) => createBillingPeriod(payload, SILENT),
    update: (payload) => updateBillingPeriod(payload, SILENT),
    remove: (id) => deleteBillingPeriod(id, SILENT),
  },
  subscriptionPlan: {
    list: () => getSubscriptionPlans(SILENT),
    create: (payload) => createSubscriptionPlan(payload, SILENT),
    update: (payload) => updateSubscriptionPlan(payload, SILENT),
    remove: (id) => deleteSubscriptionPlan(id, SILENT),
  },
  planService: {
    list: () => getPlanServices(SILENT),
    create: (payload) => createPlanService(payload, SILENT),
    update: (payload) => updatePlanService(payload, SILENT),
    remove: (id) => deletePlanService(id, SILENT),
  },
};

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
  { key: "planService", label: "Plan Services", Component: PlanServiceTab },
];

export default function MasterDataTab({ onCancel }) {
  const [activeKey, setActiveKey] = useState(TABS[0].key);
  const [deleteRequest, setDeleteRequest] = useState(null);

  // Parent state for lookup datasets
  const [plans, setPlans] = useState([]);
  const [services, setServices] = useState([]);

  const active = TABS.find((t) => t.key === activeKey) || TABS[0];
  const ActiveTab = active.Component;

  // Load lookup options in parent when Plan Services tab is active
  const loadLookups = useCallback(async () => {
    try {
      const [plansRes, servicesRes] = await Promise.all([
        getSubscriptionPlans(SILENT),
        getServices(SILENT),
      ]);
      setPlans(Array.isArray(plansRes) ? plansRes : plansRes?.data || []);
      setServices(
        Array.isArray(servicesRes) ? servicesRes : servicesRes?.data || [],
      );
    } catch (err) {
      log("Failed to fetch lookup data", err);
    }
  }, []);

  useEffect(() => {
    log("tab opened", activeKey);
    if (activeKey === "planService") {
      loadLookups();
    }
  }, [activeKey, loadLookups]);

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
        plans={plans}
        services={services}
      />

      {/* Delete confirmation modal */}
      {deleteRequest && (
        <DeleteConfirmModal request={deleteRequest} onClose={closeDelete} />
      )}
    </div>
  );
}
