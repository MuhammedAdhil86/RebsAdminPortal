import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import { getUpcomingSubscriptions } from "../../services/SubscriptionService";
import {
  DataTable,
  StatusBadge,
  SERVICE_COLUMNS,
  EXTENSION_COLUMNS,
  formatDate,
} from "../subscriptions/SubscriptionsTab";

/* Place in src/components/modals/UpcomingPlansModal.jsx
   GET /tenant/subscription/upcoming-subscriptions/{company_id}
   -> { company, current_subscription, upcoming_subscription } */

const SILENT = { silent: true };

// "ACTIVE" -> "Active"
const statusLabel = (status = "") =>
  status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "—";

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

function SubscriptionBlock({ title, sub }) {
  const info = [
    { label: "Subscription ID", value: sub.subscription_id },
    { label: "Plan", value: sub.plan?.name },
    { label: "Plan Code", value: sub.plan?.code },
    {
      label: "Billing Period",
      value: sub.billing_period
        ? `${sub.billing_period.name}${
            sub.billing_period.months ? ` (${sub.billing_period.months} mo)` : ""
          }`
        : "—",
    },
    { label: "Start Date", value: formatDate(sub.start_date) },
    { label: "Base End Date", value: formatDate(sub.base_end_date) },
    { label: "Extension", value: `${sub.extension_days ?? 0} days` },
    { label: "End Date", value: formatDate(sub.end_date) },
  ];

  const serviceRows = (sub.services || []).map((s) => ({
    ...s,
    rowKey: `${sub.subscription_id}-${s.service_id}`,
  }));
  const extensionRows = (sub.user_extensions || []).map((e, i) => ({
    ...e,
    rowKey: `${sub.subscription_id}-${e.service_id}-${i}`,
  }));

  return (
    <div className="border border-gray-100 rounded-xl shadow-sm bg-white">
      <div className="flex items-center justify-between px-5 pt-4">
        <p className="text-gray-900">{title}</p>
        <StatusBadge status={statusLabel(sub.status)} />
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-5">
        {info.map((item) => (
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

      <div className="px-5 pb-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            Services
          </p>
          <DataTable
            columns={SERVICE_COLUMNS}
            rows={serviceRows}
            emptyText="No services"
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            User Extensions
          </p>
          <DataTable
            columns={EXTENSION_COLUMNS}
            rows={extensionRows}
            emptyText="No user extensions"
          />
        </div>
      </div>
    </div>
  );
}

function UpcomingPlansModal({ row, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getUpcomingSubscriptions(row.id, SILENT); // company_id
        const payload =
          res?.current_subscription !== undefined ||
          res?.upcoming_subscription !== undefined
            ? res
            : res?.data || res;
        if (active) setData(payload);
      } catch (err) {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load upcoming plans.",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [row.id]);

  const current = data?.current_subscription;
  const upcoming = asList(data?.upcoming_subscription);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-50 rounded-xl shadow-lg p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-gray-900">Upcoming Plans</p>
            <p className="text-[11px] text-gray-500">{row.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-black"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-gray-400">
            <Icon icon="line-md:loading-loop" className="w-4 h-4" />
            Loading...
          </div>
        ) : (
          <>
            {current && (
              <SubscriptionBlock title="Current Subscription" sub={current} />
            )}

            {upcoming.length > 0 ? (
              upcoming.map((u, i) => (
                <SubscriptionBlock
                  key={u.subscription_id ?? i}
                  title={
                    upcoming.length > 1
                      ? `Upcoming Subscription ${i + 1}`
                      : "Upcoming Subscription"
                  }
                  sub={u}
                />
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl py-12 text-center text-gray-400">
                <Icon
                  icon="solar:document-text-linear"
                  className="w-10 h-10 mx-auto mb-2 opacity-60"
                />
                No upcoming subscription
              </div>
            )}
          </>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpcomingPlansModal;
