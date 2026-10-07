import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import {
  getTenantSubscriptions,
  updateSubscriptionStatus,
  renewSubscription,
} from "../services/SubscriptionService"; // adjust path if needed
import { getBillingPeriods } from "../services/MasterService"; // adjust path if needed
import SubscriptionsTab, {
  CompanyCell,
  StatusBadge,
  DataTable,
  SERVICE_COLUMNS,
  EXTENSION_COLUMNS,
  formatDate,
} from "../components/subscriptions/SubscriptionsTab";
import UserExtensionsTab from "../components/subscriptions/UserExtensionsTab";
import ConfirmModal from "../components/modals/ConfirmModal";
import ChangePlanModal from "../components/modals/ChangePlanModal";

/* API:  GET /tenant/subscription/tenant-info
   Response: { companies: [ { ..., subscription: {...} } ] } */

const SILENT = { silent: true };

const toCompanies = (res) =>
  res?.companies ||
  res?.data?.companies ||
  (Array.isArray(res) ? res : res?.data) ||
  [];

// "ACTIVE" -> "Active"
const statusLabel = (status = "") =>
  status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "—";

/* Flatten API companies into table rows */
const toRows = (companies) =>
  companies.map((c) => {
    const sub = c.subscription || {};
    return {
      id: c.company_id,
      subscriptionId: sub.subscription_id ?? sub.id, // adjust if your API uses another key
      billingPeriodId: sub.billing_period?.id,
      billingPeriodCode: sub.billing_period?.code,
      planId: sub.plan?.id,
      name: c.company_name,
      email: c.company_email,
      phone: c.phone_number,
      country: c.country,
      organisationType: c.organisation_type,
      contactPerson: c.contact_person,
      planName: sub.plan?.name,
      planCode: sub.plan?.code,
      billingPeriod: sub.billing_period?.name,
      billingMonths: sub.billing_period?.months,
      startDate: sub.start_date,
      baseEndDate: sub.base_end_date,
      extensionDays: sub.extension_days ?? 0,
      endDate: sub.end_date,
      status: statusLabel(sub.status),
      services: sub.services || [],
      userExtensions: sub.user_extensions || [],
      raw: c,
    };
  });

/* ------------------------------------------------------------------ */
/*  DETAIL VIEW (opened from the View action, Back returns to list)   */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  RENEW MODAL (POST /subscriptions/{id}/renew)                      */
/* ------------------------------------------------------------------ */

const toNum = (v) => (v !== "" && !Number.isNaN(Number(v)) ? Number(v) : v);

function RenewModal({ row, onClose, onRenewed }) {
  const [usePricing, setUsePricing] = useState(true);
  // starts on the current billing period; only sent if the user picks another
  const [billingPeriodId, setBillingPeriodId] = useState(
    row.billingPeriodId != null ? String(row.billingPeriodId) : "",
  );
  const [periods, setPeriods] = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [extendUsers, setExtendUsers] = useState(false);
  const [extensions, setExtensions] = useState(() =>
    row.userExtensions.map((e) => ({
      service_id: e.service_id,
      additional_users: e.additional_users ?? "",
    })),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingPeriods(true);
        const res = await getBillingPeriods(SILENT);
        const list = Array.isArray(res)
          ? res
          : res?.data || res?.billing_periods || [];
        if (active) setPeriods(list);
      } catch (err) {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load billing periods.",
        );
      } finally {
        if (active) setLoadingPeriods(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateExt = (i, patch) =>
    setExtensions((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    );
  const removeExt = (i) =>
    setExtensions((prev) => prev.filter((_, idx) => idx !== i));
  const addExt = () =>
    setExtensions((prev) => [
      ...prev,
      { service_id: "", additional_users: "" },
    ]);

  const buildOptions = () => {
    // send only what the user changed; a plain renew sends {}
    const options = {};
    if (!usePricing) options.use_current_pricing = false; // server default is true
    if (
      billingPeriodId !== "" &&
      Number(billingPeriodId) !== Number(row.billingPeriodId)
    )
      options.billing_period_id = toNum(billingPeriodId);
    if (extendUsers) {
      options.extend_users = true;
      options.user_extensions = extensions.map((e) => ({
        service_id: toNum(e.service_id),
        additional_users: Number(e.additional_users),
      }));
    }
    return options;
  };

  const handleRenewClick = () => {
    if (!row.subscriptionId) {
      toast.error("Subscription id not found.");
      return;
    }
    if (extendUsers) {
      if (extensions.length === 0) {
        toast.error(
          "Add at least one user extension or turn off Extend users.",
        );
        return;
      }
      const invalid = extensions.some(
        (e) => e.service_id === "" || !(Number(e.additional_users) > 0),
      );
      if (invalid) {
        toast.error(
          "Select a service and enter additional users for each row.",
        );
        return;
      }
    }
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      setSaving(true);
      await renewSubscription(row.subscriptionId, buildOptions(), SILENT);
      toast.success("Subscription renewed successfully.");
      setConfirmOpen(false);
      onRenewed();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to renew subscription.",
      );
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-black";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40"
      onClick={() => !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-lg p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-gray-900">Renew Subscription</p>
          <p className="text-[11px] text-gray-500">
            Leave everything as default to renew with current pricing and carry
            existing extensions over
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={usePricing}
            onChange={(e) => setUsePricing(e.target.checked)}
            className="w-4 h-4 accent-black"
          />
          Use current pricing (untick to keep old prices)
        </label>

        <div className="flex flex-col gap-1.5 max-w-xs">
          <label className="text-[11px] uppercase tracking-wider text-gray-500">
            Billing Period
          </label>
          <select
            value={billingPeriodId}
            onChange={(e) => setBillingPeriodId(e.target.value)}
            disabled={loadingPeriods}
            className={inputCls}
          >
            {loadingPeriods && <option value="">Loading...</option>}
            {periods.map((bp) => (
              <option key={bp.id} value={bp.id}>
                {bp.name}
                {bp.months ? ` (${bp.months} mo)` : ""}
                {Number(bp.id) === Number(row.billingPeriodId)
                  ? " - current"
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={extendUsers}
            onChange={(e) => setExtendUsers(e.target.checked)}
            className="w-4 h-4 accent-black"
          />
          Extend users
        </label>

        {extendUsers && (
          <div className="flex flex-col gap-3">
            {extensions.map((ext, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3">
                <select
                  value={ext.service_id}
                  onChange={(e) => updateExt(i, { service_id: e.target.value })}
                  className={`${inputCls} min-w-[12rem]`}
                >
                  <option value="">Select service</option>
                  {row.services.map((s) => (
                    <option key={s.service_id} value={s.service_id}>
                      {s.service_name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={ext.additional_users}
                  onChange={(e) =>
                    updateExt(i, { additional_users: e.target.value })
                  }
                  placeholder="Additional users"
                  className={`${inputCls} w-40`}
                />
                <button
                  type="button"
                  onClick={() => removeExt(i)}
                  aria-label="Remove"
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600"
                >
                  <Icon
                    icon="mdi:trash-can-outline"
                    className="w-[18px] h-[18px]"
                  />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addExt}
              className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <Icon icon="mdi:plus" className="w-4 h-4" />
              Add service
            </button>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRenewClick}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon icon="mdi:autorenew" className="w-4 h-4" />
            Renew
          </button>
        </div>

        <ConfirmModal
          open={confirmOpen}
          title="Renew subscription?"
          message={`Are you sure you want to renew the subscription for ${row.name}?`}
          confirmText="Renew"
          loading={saving}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    </div>
  );
}

const STATUS_ACTIONS = [
  {
    value: "ACTIVE",
    label: "Activate",
    icon: "mdi:check-circle-outline",
    className: "bg-green-600 text-white hover:bg-green-700",
  },
  {
    value: "SUSPENDED",
    label: "Suspend",
    icon: "mdi:pause-circle-outline",
    className: "bg-red-600 text-white hover:bg-red-700",
  },
];

function SubscriptionDetail({ row, onBack, onStatusChange, onRenewed }) {
  const [saving, setSaving] = useState("");
  const [pending, setPending] = useState(null); // action waiting for confirmation
  const [renewOpen, setRenewOpen] = useState(false);
  const [changePlanOpen, setChangePlanOpen] = useState(false);

  const serviceRows = row.services.map((sv) => ({
    ...sv,
    rowKey: `${row.id}-${sv.service_id}`,
  }));
  const extensionRows = row.userExtensions.map((e, i) => ({
    ...e,
    rowKey: `${row.id}-${e.service_id}-${i}`,
  }));

  const handleStatus = async (newStatus) => {
    if (!row.subscriptionId) {
      toast.error("Subscription id not found.");
      setPending(null);
      return;
    }
    try {
      setSaving(newStatus);
      await updateSubscriptionStatus(row.subscriptionId, newStatus, SILENT);
      onStatusChange(row.id, statusLabel(newStatus));
      toast.success(
        `Subscription status updated to ${statusLabel(newStatus)}.`,
      );
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update subscription status.",
      );
    } finally {
      setSaving("");
      setPending(null);
    }
  };

  const companyInfo = [
    { label: "Company ID", value: row.id },
    { label: "Company Name", value: row.name },
    { label: "Email", value: row.email },
    { label: "Phone", value: row.phone },
    { label: "Country", value: row.country },
    { label: "Organisation Type", value: row.organisationType },
    { label: "Contact Person", value: row.contactPerson },
  ];

  const subscriptionInfo = [
    { label: "Subscription ID", value: row.subscriptionId },
    { label: "Status", value: row.status },
    { label: "Plan", value: row.planName },
    { label: "Plan Code", value: row.planCode },
    {
      label: "Billing Period",
      value: row.billingPeriod
        ? `${row.billingPeriod}${row.billingMonths ? ` (${row.billingMonths} mo)` : ""}`
        : "—",
    },
    { label: "Billing Code", value: row.billingPeriodCode },
    { label: "Start Date", value: formatDate(row.startDate) },
    { label: "Base End Date", value: formatDate(row.baseEndDate) },
    { label: "Extension", value: `${row.extensionDays} days` },
    { label: "End Date", value: formatDate(row.endDate) },
  ];

  const InfoCard = ({ title, items }) => (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
      <p className="px-5 pt-4 text-gray-900">{title}</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-5">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-[11px] uppercase tracking-wider text-gray-500">
              {item.label}
            </dt>
            <dd className="text-sm text-gray-900 mt-1 break-words">
              {item.value || item.value === 0 ? item.value : "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 flex flex-col gap-6">
      {/* header */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyCell name={row.name} email={row.email} />
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={row.status} />
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Icon icon="mdi:arrow-left" className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col gap-4">
        <div>
          <p className="text-gray-900">Manage Subscription</p>
          <p className="text-[11px] text-gray-500">
            Current status: {row.status}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {STATUS_ACTIONS.map((a) => {
            const isCurrent = row.status === statusLabel(a.value);
            return (
              <button
                key={a.value}
                type="button"
                disabled={isCurrent || !!saving}
                onClick={() => setPending(a)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${a.className}`}
              >
                <Icon
                  icon={saving === a.value ? "line-md:loading-loop" : a.icon}
                  className="w-4 h-4"
                />
                {a.label}
              </button>
            );
          })}
          <button
            type="button"
            disabled={!!saving}
            onClick={() => setRenewOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon icon="mdi:autorenew" className="w-4 h-4" />
            Renew Subscription
          </button>
          <button
            type="button"
            disabled={!!saving}
            onClick={() => setChangePlanOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-black text-black hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon icon="mdi:swap-horizontal" className="w-4 h-4" />
            Change Plan
          </button>
        </div>
      </div>

      <InfoCard title="Company Details" items={companyInfo} />
      <InfoCard title="Subscription Details" items={subscriptionInfo} />

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-gray-900">Services</p>
          <p className="text-[11px] text-gray-500">
            Services and pricing in this subscription
          </p>
        </div>
        <DataTable
          columns={SERVICE_COLUMNS}
          rows={serviceRows}
          emptyText="No services in this subscription"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-gray-900">User Extensions</p>
          <p className="text-[11px] text-gray-500">
            Additional users added to this subscription
          </p>
        </div>
        <DataTable
          columns={EXTENSION_COLUMNS}
          rows={extensionRows}
          emptyText="No user extensions"
        />
      </div>

      {renewOpen && (
        <RenewModal
          row={row}
          onClose={() => setRenewOpen(false)}
          onRenewed={onRenewed}
        />
      )}

      {changePlanOpen && (
        <ChangePlanModal
          row={row}
          onClose={() => setChangePlanOpen(false)}
          onChanged={onRenewed} // back to the list and reload
        />
      )}

      <ConfirmModal
        open={!!pending}
        title={`${pending?.label || ""} subscription?`}
        message={`Are you sure you want to ${(pending?.label || "").toLowerCase()} the subscription for ${row.name}?`}
        confirmText={pending?.label || "Confirm"}
        confirmClassName={pending?.className}
        loading={!!saving}
        onConfirm={() => handleStatus(pending.value)}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PARENT PAGE (sidebar + header come from MainLayout)               */
/* ------------------------------------------------------------------ */

const TABS = [
  { label: "Subscriptions", key: "subscriptions" },
  { label: "User Extensions", key: "extensions" },
];

function Subscriptions() {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem("subscriptionActiveTab");
      return TABS.some((t) => t.key === saved) ? saved : "subscriptions";
    } catch {
      return "subscriptions";
    }
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("subscriptionActiveTab", activeTab);
    } catch {
      /* ignore */
    }
  }, [activeTab]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getTenantSubscriptions(SILENT);
      setRows(toRows(toCompanies(res)));
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load subscriptions.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // keep list + open detail in sync after a status change
  const handleStatusChange = (companyId, newStatus) => {
    setRows((prev) =>
      prev.map((r) => (r.id === companyId ? { ...r, status: newStatus } : r)),
    );
    setSelected((prev) => (prev ? { ...prev, status: newStatus } : prev));
  };

  // after a renew: back to the list with fresh data
  const handleRenewed = () => {
    setSelected(null);
    fetchData();
  };

  const handleTabChange = (key) => {
    setSelected(null);
    setActiveTab(key);
  };

  return (
    <>
      <section className="bg-white mt-4 sm:mt-6 w-full px-4 sm:px-6">
        <div className="border-b flex flex-wrap gap-4 sm:gap-6 pt-4 text-sm">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`pb-2 whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "border-b-2 border-black text-black"
                  : "text-[#AFAFAF]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-6 mb-8 w-full">
        {error && (
          <div className="mx-4 sm:mx-6 mb-4 flex items-center justify-between p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchData}
              className="font-medium underline"
            >
              Retry
            </button>
          </div>
        )}

        {selected ? (
          <SubscriptionDetail
            row={selected}
            onBack={() => setSelected(null)}
            onStatusChange={handleStatusChange}
            onRenewed={handleRenewed}
          />
        ) : (
          <>
            {activeTab === "subscriptions" && (
              <SubscriptionsTab
                rows={rows}
                loading={loading}
                onView={setSelected}
              />
            )}
            {activeTab === "extensions" && (
              <UserExtensionsTab rows={rows} loading={loading} />
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Subscriptions;
