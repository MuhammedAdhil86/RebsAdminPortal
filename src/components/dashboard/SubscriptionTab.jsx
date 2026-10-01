import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import {
  UniversalTable,
  Modal,
  SearchBox,
  statusPill,
  companyCell,
} from "./CompaniesTab"; // shared table / modal / search / cells (already in your project)

/* ------------------------------------------------------------------ */
/*  STATIC DATA – no API, nothing depends on today's date              */
/* ------------------------------------------------------------------ */

// Fixed "today" used for the static demo so the numbers never change
const BASE_DATE = new Date(2026, 8, 30); // 30 Sep 2026

const SUBSCRIPTIONS = [
  {
    id: 1,
    company: "Techno Soft Solutions",
    plan: "Enterprise",
    amount: "₹1,20,000",
    daysLeft: 5,
    autoRenew: true,
  },
  {
    id: 2,
    company: "Bright Retail Pvt Ltd",
    plan: "Business",
    amount: "₹60,000",
    daysLeft: -3,
    autoRenew: false,
  },
  {
    id: 3,
    company: "Nova Health Care",
    plan: "Enterprise",
    amount: "₹1,20,000",
    daysLeft: 25,
    autoRenew: true,
  },
  {
    id: 4,
    company: "Skyline Constructions",
    plan: "Business",
    amount: "₹60,000",
    daysLeft: 12,
    autoRenew: false,
  },
  {
    id: 5,
    company: "Orbit Media",
    plan: "Starter",
    amount: "₹24,000",
    daysLeft: 2,
    autoRenew: false,
  },
  {
    id: 6,
    company: "Greenfield Logistics",
    plan: "Starter",
    amount: "₹24,000",
    daysLeft: 45,
    autoRenew: true,
  },
];

const RENEW_OPTIONS = [
  { label: "1 Month", months: 1 },
  { label: "6 Months", months: 6 },
  { label: "12 Months", months: 12 },
];

const REMINDER_DAYS = [
  { key: 30, label: "30 days before due date" },
  { key: 15, label: "15 days before due date" },
  { key: 7, label: "7 days before due date" },
  { key: 1, label: "1 day before due date" },
  { key: 0, label: "On the due date" },
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

const dueLabel = (daysLeft) => {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + daysLeft);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatus = (daysLeft) =>
  daysLeft < 0 ? "Overdue" : daysLeft <= 7 ? "Due Soon" : "Active";

const plural = (n) => (n === 1 ? "" : "s");

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
        checked ? "bg-black" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

const daysLeftCell = (daysLeft) => {
  if (daysLeft < 0)
    return (
      <span className="text-red-600">
        {Math.abs(daysLeft)} day{plural(Math.abs(daysLeft))} overdue
      </span>
    );
  if (daysLeft === 0) return <span className="text-red-600">Due today</span>;
  return (
    <span className={daysLeft <= 7 ? "text-yellow-700" : "text-gray-700"}>
      {daysLeft} day{plural(daysLeft)} left
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  SUBSCRIPTION MANAGEMENT TAB                                        */
/* ------------------------------------------------------------------ */

function SubscriptionsTab() {
  const [subs, setSubs] = useState(
    SUBSCRIPTIONS.map((s) => ({ ...s, reminderSent: false })),
  );
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const [renewId, setRenewId] = useState(null);
  const [renewMonths, setRenewMonths] = useState(12);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    days: { 30: true, 15: true, 7: true, 1: true, 0: true },
    email: true,
    inApp: true,
  });

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const q = search.toLowerCase();

  const rows = subs.map((s) => ({
    ...s,
    dueDate: dueLabel(s.daysLeft),
    status: getStatus(s.daysLeft),
  }));

  const updateSub = (id, patch) =>
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const sendReminder = (row) => {
    updateSub(row.id, { reminderSent: true });
    setToast(`Renewal reminder sent to ${row.company}`);
  };

  // Renewal: new period starts from the current due date (or today if expired)
  const renewTarget = rows.find((r) => r.id === renewId);
  const renewNewDaysLeft = renewTarget
    ? Math.max(renewTarget.daysLeft, 0) + renewMonths * 30
    : 0;

  const confirmRenew = () => {
    if (!renewTarget) return;
    updateSub(renewTarget.id, {
      daysLeft: renewNewDaysLeft,
      reminderSent: false,
    });
    setToast(
      `${renewTarget.company} renewed until ${dueLabel(renewNewDaysLeft)}`,
    );
    setRenewId(null);
  };

  const alerts = rows
    .filter((r) => r.status === "Overdue" || r.status === "Due Soon")
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const columns = [
    { label: "Company", key: "company", width: 220, render: companyCell },
    { label: "Plan", key: "plan", width: 100 },
    { label: "Amount", key: "amount", width: 110 },
    { label: "Due Date", key: "dueDate", width: 120 },
    {
      label: "Days Left",
      key: "daysLeft",
      width: 130,
      render: (v) => daysLeftCell(v),
    },
    {
      label: "Auto Renew",
      key: "autoRenew",
      width: 100,
      render: (v, row) => (
        <Toggle
          checked={v}
          label={`Auto renew for ${row.company}`}
          onChange={() => updateSub(row.id, { autoRenew: !v })}
        />
      ),
    },
    {
      label: "Status",
      key: "status",
      width: 100,
      render: (v) => statusPill(v),
    },
    {
      label: "Actions",
      key: "actions",
      width: 190,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRenewId(row.id);
              setRenewMonths(12);
            }}
            className="px-3 py-1.5 text-[11px] rounded-lg bg-black text-white hover:bg-gray-800 whitespace-nowrap"
          >
            Renew
          </button>
          <button
            onClick={() => sendReminder(row)}
            disabled={row.reminderSent}
            className="px-3 py-1.5 text-[11px] rounded-lg border text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {row.reminderSent ? "Reminded" : "Remind"}
          </button>
        </div>
      ),
    },
  ];

  const filtered = rows.filter((r) => r.company.toLowerCase().includes(q));

  return (
    <div className="flex-1 grid grid-cols-1 gap-4 px-4 pb-4 bg-[#f9fafb] rounded-xl w-full mx-auto font-[Poppins]">
      {/* Title + actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-base text-gray-800">Subscription Management</h3>

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

      <UniversalTable
        columns={columns}
        data={filtered}
        rowsPerPage={8}
        className="rounded-lg shadow-sm"
      />

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
          className="w-full bg-black text-white text-xs rounded-lg py-2.5 hover:bg-gray-800"
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
