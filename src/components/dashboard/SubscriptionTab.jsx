import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import {
  UniversalTable,
  Modal,
  SearchBox,
  statusPill,
  companyCell,
} from "./CompaniesTab";
import { getTenantSubscriptions } from "../../services/SubscriptionService";

const REMINDER_DAYS = [
  { key: 30, label: "30 days before due date" },
  { key: 15, label: "15 days before due date" },
  { key: 7, label: "7 days before due date" },
  { key: 1, label: "1 day before due date" },
  { key: 0, label: "On the due date" },
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                           */
/* ------------------------------------------------------------------ */

const formatDate = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return "—";
  return dateObj.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatINR = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);

const calculateBalanceDays = (targetDateString) => {
  if (!targetDateString) return 0;
  const target = new Date(targetDateString);
  if (isNaN(target.getTime())) return 0;

  const now = new Date();
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const utcTarget = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  return Math.round((utcTarget - utcNow) / (1000 * 60 * 60 * 24));
};

const getStatus = (daysLeft, apiStatus) => {
  if (apiStatus && apiStatus.toLowerCase() === "expired") return "Overdue";
  if (daysLeft < 0) return "Overdue";
  if (daysLeft <= 7) return "Due Soon";
  return "Active";
};

const plural = (n) => (n === 1 ? "" : "s");

const balanceDaysCell = (daysLeft) => {
  if (daysLeft < 0) {
    const overdue = Math.abs(daysLeft);
    return (
      <span className="text-red-600 font-medium">
        {overdue} day{plural(overdue)} overdue
      </span>
    );
  }
  if (daysLeft === 0) {
    return <span className="text-amber-600 font-semibold">Due today</span>;
  }
  return (
    <span
      className={daysLeft <= 7 ? "text-amber-700 font-medium" : "text-gray-700"}
    >
      {daysLeft} day{plural(daysLeft)} left
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  HOVER COMPONENT (Uses fixed coordinates to prevent clipping)      */
/* ------------------------------------------------------------------ */

function HoverDetail({ title, label, icon, items }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      top: rect.top - 8, // slight offset above
      left: rect.left,
    });
    setVisible(true);
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  return (
    <div
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="inline-flex items-center gap-1.5 font-medium text-gray-800 border-b border-dashed border-gray-400 cursor-pointer hover:text-black">
        {label}
        <Icon
          icon="mdi:information-outline"
          className="w-3.5 h-3.5 text-gray-400 hover:text-black"
        />
      </span>

      {visible && (
        <div
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: "translateY(-100%)",
          }}
          className="z-[9999] min-w-[200px] p-3 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 text-xs pointer-events-none transition-all"
        >
          <p className="font-semibold text-gray-900 border-b pb-1.5 mb-2 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
            <Icon icon={icon} className="w-3.5 h-3.5 text-gray-600" />
            {title}
          </p>
          <div className="space-y-1.5 text-[11px]">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center gap-3"
              >
                <span className="text-gray-400">{it.label}:</span>
                {it.badge ? (
                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">
                    {it.value}
                  </span>
                ) : (
                  <span className="font-medium text-gray-800">{it.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DATA ADAPTER                                                      */
/* ------------------------------------------------------------------ */

const mapApiCompanyToRow = (item) => {
  const sub = item.subscription || {};
  const endDateStr = sub.end_date || sub.base_end_date;
  const endDateObj = endDateStr ? new Date(endDateStr) : null;
  const daysLeft = calculateBalanceDays(endDateStr);

  const servicesTotal = (sub.services || []).reduce(
    (acc, curr) => acc + (Number(curr.base_amount) || 0),
    0,
  );
  const extensionsTotal = (sub.user_extensions || []).reduce(
    (acc, curr) => acc + (Number(curr.total_amount) || 0),
    0,
  );
  const totalAmount = servicesTotal + extensionsTotal;

  return {
    id: item.company_id,
    company: item.company_name,
    plan: sub.plan || null,
    billingPeriod: sub.billing_period || null,
    amount: totalAmount > 0 ? formatINR(totalAmount) : "₹0",
    daysLeft,
    endDateObj,
    dueDate: formatDate(endDateObj),
    status: getStatus(daysLeft, sub.status),
    raw: item,
  };
};

/* ------------------------------------------------------------------ */
/*  SUBSCRIPTION MANAGEMENT TAB                                       */
/* ------------------------------------------------------------------ */

function SubscriptionsTab() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    days: { 30: true, 15: true, 7: true, 1: true, 0: true },
    email: true,
    inApp: true,
  });

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTenantSubscriptions();
      const list = res?.companies || [];
      setSubs(list.map(mapApiCompanyToRow));
    } catch (err) {
      setError("Failed to fetch tenant subscriptions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const q = search.toLowerCase();

  const columns = [
    { label: "Company", key: "company", width: 220, render: companyCell },
    {
      label: "Plan",
      key: "plan",
      width: 170,
      render: (plan) => {
        if (!plan?.name) return <span className="text-gray-400">—</span>;
        return (
          <HoverDetail
            title="Plan Details"
            label={plan.name}
            icon="mdi:shield-star-outline"
            items={[
              { label: "Name", value: plan.name },
              { label: "Code", value: plan.code, badge: true },
            ]}
          />
        );
      },
    },
    {
      label: "Billing Period",
      key: "billingPeriod",
      width: 150,
      render: (bp) => {
        if (!bp?.name) return <span className="text-gray-400">—</span>;
        return (
          <HoverDetail
            title="Billing Details"
            label={bp.name}
            icon="mdi:calendar-clock"
            items={[
              { label: "Name", value: bp.name },
              { label: "Code", value: bp.code, badge: true },
              {
                label: "Duration",
                value: `${bp.months} month${plural(bp.months)}`,
              },
            ]}
          />
        );
      },
    },
    { label: "Amount", key: "amount", width: 120 },
    { label: "Due Date", key: "dueDate", width: 130 },
    {
      label: "Balance Days",
      key: "daysLeft",
      width: 140,
      render: (v) => balanceDaysCell(v),
    },
    {
      label: "Status",
      key: "status",
      width: 110,
      render: (v) => statusPill(v),
    },
  ];

  const filtered = subs.filter((r) => r.company?.toLowerCase().includes(q));

  return (
    <div className="flex-1 grid grid-cols-1 gap-4 px-4 pb-4 bg-[#f9fafb] rounded-xl w-full mx-auto font-[Poppins]">
      {/* Title + actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
        <h3 className="text-base font-semibold text-gray-800">
          Subscription Management
        </h3>

        <div className="flex items-center gap-2">
          <SearchBox value={search} onChange={setSearch} />
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 sm:px-4 py-2 text-xs rounded-lg border bg-black text-white transition-all hover:bg-gray-800 whitespace-nowrap flex items-center gap-2"
          >
            <Icon icon="mdi:bell-cog-outline" className="w-4 h-4" />
            Notification Settings
          </button>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm">
          <Icon
            icon="eos-icons:loading"
            className="w-6 h-6 animate-spin text-gray-500 mb-2"
          />
          <p className="text-xs text-gray-500">Loading subscriptions...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-red-100">
          <p className="text-xs text-red-500 mb-3">{error}</p>
          <button
            onClick={fetchSubscriptions}
            className="px-3 py-1.5 text-xs bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      ) : (
        <UniversalTable
          columns={columns}
          data={filtered}
          rowsPerPage={8}
          className="rounded-lg shadow-sm"
        />
      )}

      {/* Notification settings modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Renewal Notifications"
      >
        <p className="text-xs text-gray-500 mb-3">
          Send a renewal reminder to the company admin:
        </p>
        <div className="grid gap-2 mb-4">
          {REMINDER_DAYS.map((d) => (
            <label
              key={d.key}
              className="flex items-center justify-between text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2 cursor-pointer"
            >
              {d.label}
              <input
                type="checkbox"
                checked={settings.days[d.key]}
                onChange={() =>
                  setSettings((s) => ({
                    ...s,
                    days: { ...s.days, [d.key]: !s.days[d.key] },
                  }))
                }
                className="h-4 w-4 accent-black cursor-pointer"
              />
            </label>
          ))}
        </div>

        <p className="text-xs text-gray-500 mb-2">Send through</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { key: "email", label: "Email" },
            { key: "inApp", label: "In-app" },
          ].map((c) => (
            <label
              key={c.key}
              className="flex items-center justify-between text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2 cursor-pointer"
            >
              {c.label}
              <input
                type="checkbox"
                checked={settings[c.key]}
                onChange={() =>
                  setSettings((s) => ({ ...s, [c.key]: !s[c.key] }))
                }
                className="h-4 w-4 accent-black cursor-pointer"
              />
            </label>
          ))}
        </div>

        <button
          onClick={() => {
            setIsSettingsOpen(false);
            setToast("Notification settings saved");
          }}
          className="w-full bg-black text-white text-xs rounded-lg py-2.5 hover:bg-gray-800 transition-colors"
        >
          Save Settings
        </button>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] bg-black text-white text-xs px-4 py-3 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default SubscriptionsTab;
