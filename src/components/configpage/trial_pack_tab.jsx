import React, { useEffect, useMemo, useState } from "react";
import MasterDataPanel from "./master_data_panel";
import { getServices } from "../../services/MasterService";

/**
 * Trial Pack tab: configuration & form fields only.
 * The API and the delete modal request (requestDelete) are passed in by
 * MasterDataTab. Services for the multi-select are loaded here.
 *
 *   api = { list, save, remove, updateStatus }
 *   (save = POST /teqbae/trial/upsert-packs for both create and update)
 */

const SILENT = { silent: true };

const serviceNames = (item) =>
  (item.services || []).map((s) => s.name).join(", ");

/* Table columns (explicit, because services/status need custom display) */
const COLUMNS = [
  { key: "name", label: "Pack Name", primary: true },
  { key: "code", label: "Code" },
  {
    key: "duration_days",
    label: "Duration",
    get: (item) =>
      item.duration_days == null
        ? ""
        : `${item.duration_days} ${item.duration_days === 1 ? "day" : "days"}`,
  },
  {
    key: "services",
    label: "Services",
    get: serviceNames, // used by search
    render: (item) =>
      (item.services || []).length === 0 ? (
        "—"
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {item.services.map((svc) => (
            <span
              key={svc.id}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-black border border-blue-100"
            >
              {svc.name}
            </span>
          ))}
        </div>
      ),
  },
  {
    key: "is_active",
    label: "Status",
    get: (item) => (item.is_active ? "Active" : "Inactive"),
    render: (item) => (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
          item.is_active
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-gray-100 text-gray-600 border-gray-200"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            item.is_active ? "bg-green-500" : "bg-gray-400"
          }`}
        />
        {item.is_active ? "Active" : "Inactive"}
      </span>
    ),
  },
];

/* Extra row control: on/off switch for activate / deactivate (PATCH .../update-status) */
const EXTRA_ACTIONS = [
  {
    key: "toggle-status",
    variant: "switch",
    checked: (item) => Boolean(item.is_active),
    title: (item) => (item.is_active ? "Deactivate" : "Activate"),
    onClick: async (item, { api, refresh }) => {
      const next = !item.is_active;
      await api.updateStatus(item.id, next);
      await refresh();
      return `Trial pack ${next ? "activated" : "deactivated"}.`;
    },
  },
];

const buildSection = (serviceOptions) => ({
  key: "trialPack",
  label: "Trial Packs",
  singular: "Trial Pack",
  icon: "mdi:flask-outline",
  columns: COLUMNS,
  extraActions: EXTRA_ACTIONS,
  fields: [
    {
      name: "name",
      label: "Pack Name",
      placeholder: "e.g. 30 Days Free Trial",
      required: true,
      maxLength: 100,
    },
    {
      name: "code",
      label: "Code",
      placeholder: "e.g. TRIAL_30_DAYS",
      required: true,
      unique: true,
      transform: "uppercase",
      maxLength: 50,
    },
    {
      name: "duration_days",
      label: "Duration (Days)",
      placeholder: "e.g. 30",
      required: true,
      defaultValue: "30",
      pattern: /^[1-9]\d*$/,
      patternMessage: "Duration must be a positive integer greater than 0.",
    },
    {
      name: "service_ids",
      label: "Services",
      type: "multiselect",
      required: true,
      options: serviceOptions,
      emptyText: "No services available.",
      // edit: the API returns services: [{ id, name, code }]
      initial: (item) => (item.services || []).map((s) => Number(s.id)),
    },
    {
      name: "is_active",
      label: "Status",
      type: "select",
      required: true,
      defaultValue: "true",
      options: [
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
      ],
      initial: (item) => (item.is_active ? "true" : "false"),
    },
  ],
  toPayload: (values) => ({
    code: String(values.code || "")
      .trim()
      .toUpperCase(),
    name: String(values.name || "").trim(),
    duration_days: Number(values.duration_days),
    is_active: values.is_active === "true",
    service_ids: (values.service_ids || []).map(Number),
  }),
});

export default function TrialPackTab({ api, requestDelete }) {
  const [serviceOptions, setServiceOptions] = useState([]);

  // Services for the multi-select
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getServices(SILENT);
        const list = Array.isArray(res) ? res : res?.data || [];
        if (!cancelled) {
          setServiceOptions(
            list.map((svc) => ({
              value: svc.id,
              label: svc.name || svc.service_name,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to load services:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const section = useMemo(() => buildSection(serviceOptions), [serviceOptions]);

  // MasterDataPanel expects { list, create, update, remove }.
  // Create and update both use the upsert endpoint.
  const panelApi = useMemo(
    () => ({
      list: api.list,
      create: api.save,
      update: api.save,
      remove: api.remove,
      updateStatus: api.updateStatus,
    }),
    [api],
  );

  return (
    <MasterDataPanel
      section={section}
      api={panelApi}
      requestDelete={requestDelete}
    />
  );
}
