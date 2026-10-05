import React, { useState, useEffect, useMemo } from "react";
import MasterDataPanel from "./master_data_panel";
import {
  getPlanServices,
  getBillingPeriods,
} from "../../services/MasterService";

/**
 * Plan Service Pricing tab: configuration & form fields only.
 * Handled via MasterDataPanel and connected to MasterDataTab API.
 *
 * Plan Service and Billing Period are dropdowns, loaded from
 * getPlanServices() and getBillingPeriods(). The same lists are used to
 * show readable names in the table when the API returns only ids.
 */

const SILENT = { silent: true };

// First value that is not empty
const pick = (...values) =>
  values.find((v) => v !== undefined && v !== null && v !== "");

const toList = (res) => (Array.isArray(res) ? res : res?.data || []);

const money = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : value;
};

// Ids used to pre-fill the edit form (nested or flat shape)
const planServiceId = (item) =>
  pick(item.plan_service_id, item.plan_service?.id);
const billingPeriodId = (item) =>
  pick(item.billing_period_id, item.billing_period?.id);

const findById = (list, id) => list.find((x) => Number(x.id) === Number(id));

// Plan / service names for one plan-service record
const planNameOf = (ps) =>
  pick(ps?.plan?.name, ps?.plan_name, ps?.plan_id && `Plan #${ps.plan_id}`);
const serviceNameOf = (ps) =>
  pick(
    ps?.service?.name,
    ps?.service_name,
    ps?.service_id && `Service #${ps.service_id}`,
  );

const periodNameOf = (bp) => pick(bp?.name, bp?.code, bp?.title);

/* ------------------------------------------------------------------ */
/*  Section config (built from the lookup lists)                      */
/* ------------------------------------------------------------------ */

const buildSection = (planServices, billingPeriods) => {
  // Table rows may carry nested objects or only ids; use whatever exists
  const resolvePlanService = (item) =>
    item.plan_service || findById(planServices, planServiceId(item));
  const resolvePeriod = (item) =>
    item.billing_period || findById(billingPeriods, billingPeriodId(item));

  return {
    key: "planServicePricing",
    label: "Plan Service Pricings",
    singular: "Plan Service Pricing",
    icon: "mdi:tag-outline",

    columns: [
      {
        key: "plan",
        label: "Plan",
        primary: true,
        get: (item) =>
          pick(
            item.plan?.name,
            item.plan_name,
            planNameOf(resolvePlanService(item)),
          ),
      },
      {
        key: "service",
        label: "Service",
        get: (item) =>
          pick(
            item.service?.name,
            item.service_name,
            serviceNameOf(resolvePlanService(item)),
          ),
      },
      {
        key: "billing_period",
        label: "Billing Period",
        get: (item) =>
          pick(
            periodNameOf(resolvePeriod(item)),
            item.billing_period_name,
            billingPeriodId(item) && `Period #${billingPeriodId(item)}`,
          ),
      },
      {
        key: "included_users",
        label: "Included Users",
        get: (item) => item.included_users,
      },
      {
        key: "base_amount",
        label: "Base Amount",
        get: (item) => money(item.base_amount),
      },
      {
        key: "additional_user_price",
        label: "Additional User Price",
        get: (item) => money(item.additional_user_price),
      },
      {
        key: "created_at",
        label: "Created",
        get: (item) => pick(item.created_at, item.created_on),
      },
    ],

    fields: [
      {
        name: "plan_service_id",
        label: "Plan Service",
        type: "select",
        placeholder: "-- Select Plan Service --",
        hint: "Plan and service mapping this price applies to",
        required: true,
        options: planServices.map((ps) => ({
          value: String(ps.id),
          label: `${planNameOf(ps) || "Plan"} → ${serviceNameOf(ps) || "Service"}`,
        })),
        initial: planServiceId,
      },
      {
        name: "billing_period_id",
        label: "Billing Period",
        type: "select",
        placeholder: "-- Select Billing Period --",
        hint: "Billing cycle for this price",
        required: true,
        options: billingPeriods.map((bp) => ({
          value: String(bp.id),
          label: periodNameOf(bp) || `Period #${bp.id}`,
        })),
        initial: billingPeriodId,
      },
      {
        name: "included_users",
        label: "Included Users",
        placeholder: "e.g. 10",
        hint: "Number of free/base users included in this tier",
        maxLength: 6,
        required: true,
        pattern: /^\d+$/,
        patternMessage: "Included users must be 0 or a positive number.",
      },
      {
        name: "base_amount",
        label: "Base Amount",
        placeholder: "e.g. 999.00",
        hint: "Base price for this billing cycle",
        maxLength: 12,
        required: true,
        pattern: /^\d+(\.\d{1,2})?$/,
        patternMessage: "Enter a valid amount (e.g. 999 or 999.00).",
      },
      {
        name: "additional_user_price",
        label: "Additional User Price",
        placeholder: "e.g. 100.00",
        hint: "Price per extra user beyond included count",
        maxLength: 12,
        required: true,
        pattern: /^\d+(\.\d{1,2})?$/,
        patternMessage: "Enter a valid amount (e.g. 100 or 100.00).",
      },
    ],

    toPayload: (values) => ({
      plan_service_id: Number(values.plan_service_id),
      billing_period_id: Number(values.billing_period_id),
      included_users: Number(values.included_users),
      base_amount: Number(values.base_amount),
      additional_user_price: Number(values.additional_user_price),
    }),
  };
};

/* ------------------------------------------------------------------ */
/*  Tab                                                               */
/* ------------------------------------------------------------------ */

// requestDelete opens the parent's delete confirmation modal
export default function PlanServicePricingTab({ api, requestDelete }) {
  const [planServices, setPlanServices] = useState([]);
  const [billingPeriods, setBillingPeriods] = useState([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [psRes, bpRes] = await Promise.all([
          getPlanServices(SILENT),
          getBillingPeriods(SILENT),
        ]);
        if (cancelled) return;
        setPlanServices(toList(psRes));
        setBillingPeriods(toList(bpRes));
      } catch (err) {
        console.error(
          "Failed to load plan service / billing period options:",
          err,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const section = useMemo(
    () => buildSection(planServices, billingPeriods),
    [planServices, billingPeriods],
  );

  return (
    <MasterDataPanel
      section={section}
      api={api}
      requestDelete={requestDelete}
    />
  );
}
