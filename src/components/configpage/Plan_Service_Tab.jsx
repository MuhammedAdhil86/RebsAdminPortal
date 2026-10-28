import React, { useEffect, useMemo, useState } from "react";
import MasterDataPanel from "./master_data_panel";
import {
  getSubscriptionPlans,
  getServices,
} from "../../services/MasterService";

/**
 * Plan Service tab: configuration & form fields only.
 * The API (list / create / update / remove) and the delete modal
 * request (requestDelete) are passed in by MasterDataTab.
 * Plans and services for the dropdowns are loaded here.
 */

const SILENT = { silent: true };

const toList = (res) => (Array.isArray(res) ? res : res?.data || []);

// Ids work whether the API returns nested objects or flat *_id fields
const planIdOf = (item) => Number(item.plan?.id ?? item.plan_id);
const serviceIdOf = (item) => Number(item.service?.id ?? item.service_id);

/* Table columns: Plan Name -> Service Name -> Code -> Created Date */
const COLUMNS = [
  {
    key: "plan_name",
    label: "Plan Name",
    primary: true,
    get: (item) => item.plan?.name || `Plan #${planIdOf(item)}`,
  },
  {
    key: "service_name",
    label: "Service Name",
    get: (item) => item.service?.name || `Service #${serviceIdOf(item)}`,
    render: (item) => (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-black border border-blue-100">
        {item.service?.name || `Service #${serviceIdOf(item)}`}
      </span>
    ),
  },
  {
    key: "plan_code",
    label: "Code",
    get: (item) => item.plan?.code || "",
    render: (item) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200">
        {item.plan?.code || "—"}
      </span>
    ),
  },
  // key ends with _at, so the panel formats it as a date
  { key: "created_at", label: "Created Date" },
];

// Service ids already mapped to a plan (ignoring the row being edited)
const mappedServiceIds = (items, planId, editingId) =>
  new Set(
    items
      .filter((row) => planIdOf(row) === Number(planId) && row.id !== editingId)
      .map(serviceIdOf),
  );

const buildSection = (plans, services) => ({
  key: "planService",
  label: "Plan Services",
  singular: "Plan Service",
  icon: "mdi:cog-outline",
  columns: COLUMNS,
  fields: [
    {
      name: "plan_id",
      label: "Subscription Plan",
      type: "select",
      placeholder: "Select subscription plan",
      required: true,
      // changing the plan clears the service, as before
      clears: ["service_id"],
      // the plan of an existing mapping cannot be changed
      disabled: ({ isEdit }) => isEdit,
      options: plans.map((p) => ({
        value: p.id,
        label: `${p.name || p.title}${p.code ? ` (${p.code})` : ""}`,
      })),
      initial: (item) => String(planIdOf(item) || ""),
    },
    {
      name: "service_id",
      label: "Service",
      type: "select",
      placeholder: "Select service",
      hint: "Select the plan first. Services already added to the plan are disabled.",
      required: true,
      disabled: ({ values }) => !values.plan_id,
      // services already mapped to the chosen plan are disabled
      options: ({ values, items, item }) => {
        const used = values.plan_id
          ? mappedServiceIds(items, values.plan_id, item?.id)
          : new Set();
        return services.map((svc) => {
          const added = used.has(Number(svc.id));
          return {
            value: svc.id,
            label: `${svc.name || svc.service_name}${added ? " (Already added to plan)" : ""}`,
            disabled: added,
          };
        });
      },
      initial: (item) => String(serviceIdOf(item) || ""),
    },
  ],
  // safety net in case the same plan + service pair is submitted
  validate: (values, { items, item }) => {
    const used = mappedServiceIds(items, values.plan_id, item?.id);
    return used.has(Number(values.service_id))
      ? { service_id: "This service is already added to the plan." }
      : {};
  },
  toPayload: (values) => ({
    plan_id: Number(values.plan_id),
    service_id: Number(values.service_id),
  }),
});

export default function PlanServiceTab({ api, requestDelete }) {
  const [plans, setPlans] = useState([]);
  const [services, setServices] = useState([]);

  // Dropdown master lists
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [plansRes, servicesRes] = await Promise.all([
          getSubscriptionPlans(SILENT),
          getServices(SILENT),
        ]);
        if (!cancelled) {
          setPlans(toList(plansRes));
          setServices(toList(servicesRes));
        }
      } catch (err) {
        console.error("Failed to load lookup options:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const section = useMemo(
    () => buildSection(plans, services),
    [plans, services],
  );

  return (
    <MasterDataPanel
      section={section}
      api={api}
      requestDelete={requestDelete}
    />
  );
}
