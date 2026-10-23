import React, { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import MasterDataTab from "../components/configpage/MasterDataTab"; // adjust path if needed

/* ------------------------------------------------------------------ */
/*  MOCK DATA                                                         */
/* ------------------------------------------------------------------ */

const CLIENTS = [
  {
    id: 1,
    name: "Acme Industries",
    email: "admin@acme.com",
    plan: "Enterprise",
    modules: ["HRMS", "Payroll", "CRM"],
    users: 240,
    status: "Active",
    updated: "02 Oct 2026",
  },
  {
    id: 2,
    name: "Cedar Health Group",
    email: "hr@cedarhealth.com",
    plan: "Professional",
    modules: ["HRMS"],
    users: 58,
    status: "Onboarding",
    updated: "27 Sep 2026",
  },
  {
    id: 3,
    name: "Delta Retail Pvt Ltd",
    email: "ops@deltaretail.in",
    plan: "Starter",
    modules: ["CRM"],
    users: 21,
    status: "Suspended",
    updated: "19 Sep 2026",
  },
];

const TEQBAE_PROFILE = [
  { label: "Legal Name", value: "Teqbae Technologies Pvt Ltd" },
  { label: "Registration No.", value: "U72900KL2020PTC000000" },
  { label: "Support Email", value: "support@teqbae.com" },
  { label: "Contact Number", value: "+91 00000 00000" },
  { label: "Time Zone", value: "Asia/Kolkata (IST, UTC+05:30)" },
  { label: "Default Currency", value: "INR (₹)" },
];

const TEQBAE_MODULES = [
  {
    id: 1,
    name: "HRMS",
    description: "Employee records, leave and performance",
    version: "v3.2.1",
    clients: 2,
    enabled: true,
  },
  {
    id: 2,
    name: "CRM",
    description: "Lead, pipeline and customer management",
    version: "v1.9.2",
    clients: 1,
    enabled: false,
  },
];

/* ------------------------------------------------------------------ */
/*  SHARED PIECES                                                     */
/* ------------------------------------------------------------------ */

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const STATUS_STYLES = {
  Active: "bg-green-50 text-green-700",
  Enabled: "bg-green-50 text-green-700",
  Onboarding: "bg-blue-50 text-blue-700",
  Suspended: "bg-red-50 text-red-700",
  Disabled: "bg-gray-100 text-gray-600",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] ${
        STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function DataTable({
  columns,
  rows,
  pageSize = 5,
  emptyText = "No records found",
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const start = (page - 1) * pageSize;
  const visible = rows.slice(start, start + pageSize);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3 whitespace-nowrap ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.length > 0 ? (
              visible.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50/70 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-4 text-gray-700 ${col.className || ""}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-14 text-center text-gray-400"
                >
                  <Icon
                    icon="solar:document-text-linear"
                    className="w-10 h-10 mx-auto mb-2 opacity-60"
                  />
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
        <p>
          {rows.length === 0
            ? "0 records"
            : `Showing ${start + 1}–${Math.min(start + pageSize, rows.length)} of ${rows.length}`}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <Icon icon="mdi:chevron-left" className="w-5 h-5" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`w-7 h-7 rounded-md ${
                n === page
                  ? "bg-black text-white"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <Icon icon="mdi:chevron-right" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function IconButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
    >
      <Icon icon={icon} className="w-[18px] h-[18px]" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 1: CLIENTS                                                    */
/* ------------------------------------------------------------------ */

function ClientsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CLIENTS.filter(
      (c) =>
        (statusFilter === "All" || c.status === statusFilter) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)),
    );
  }, [search, statusFilter]);

  const columns = [
    {
      key: "name",
      header: "Client",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black text-white text-xs flex items-center justify-center shrink-0">
            {initials(r.name)}
          </div>
          <div className="min-w-0">
            <p className="text-gray-900 truncate">{r.name}</p>
            <p className="text-[11px] text-gray-500 truncate">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: "plan", header: "Plan", className: "whitespace-nowrap" },
    {
      key: "modules",
      header: "Modules",
      render: (r) => (
        <div className="flex flex-wrap gap-1.5">
          {r.modules.map((m) => (
            <span
              key={m}
              className="px-2 py-0.5 rounded-md bg-gray-100 text-[11px] text-gray-700"
            >
              {m}
            </span>
          ))}
        </div>
      ),
    },
    { key: "users", header: "Users" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    { key: "updated", header: "Last Updated", className: "whitespace-nowrap" },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <div className="flex items-center gap-1">
          <IconButton icon="mdi:eye-outline" label="View details" />
          <IconButton icon="mdi:pencil-outline" label="Edit configuration" />
          <IconButton icon="mdi:dots-vertical" label="More actions" />
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 sm:px-6 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative w-full sm:max-w-xs">
            <Icon
              icon="mdi:magnify"
              className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client name or email"
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-black"
          >
            {["All", "Active", "Onboarding", "Suspended"].map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All statuses" : s}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
        >
          <Icon icon="mdi:plus" className="w-5 h-5" />
          Add Client
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        emptyText="No clients match your filters"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 2: TEQBAE (OUR COMPANY)                                       */
/* ------------------------------------------------------------------ */

function TeqbaeTab() {
  const [modules, setModules] = useState(TEQBAE_MODULES);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const toggleModule = (id) =>
    setModules((list) =>
      list.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    );

  const columns = [
    {
      key: "name",
      header: "Module",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black text-white text-xs flex items-center justify-center shrink-0">
            {initials(r.name)}
          </div>
          <div className="min-w-0">
            <p className="text-gray-900">{r.name}</p>
            <p className="text-[11px] text-gray-500">{r.description}</p>
          </div>
        </div>
      ),
    },
    { key: "version", header: "Version" },
    { key: "clients", header: "Active Clients" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusBadge status={r.enabled ? "Enabled" : "Disabled"} />
      ),
    },
    {
      key: "toggle",
      header: "Assignable",
      render: (r) => (
        <button
          type="button"
          role="switch"
          aria-checked={r.enabled}
          aria-label={`Toggle ${r.name}`}
          onClick={() => toggleModule(r.id)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            r.enabled ? "bg-black" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              r.enabled ? "translate-x-5" : ""
            }`}
          />
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <div className="flex items-center gap-1">
          <IconButton icon="mdi:cog-outline" label="Configure module" />
        </div>
      ),
    },
  ];

  /* --------------------------------------------------------------- */
  /* If Configure is clicked: Render MasterDataTab from separate     */
  /* file and pass onCancel to switch back to normal view            */
  /* --------------------------------------------------------------- */
  if (isConfiguring) {
    return <MasterDataTab onCancel={() => setIsConfiguring(false)} />;
  }

  /* --------------------------------------------------------------- */
  /* Normal View: Company Profile + Modules Table                    */
  /* --------------------------------------------------------------- */
  return (
    <div className="px-4 sm:px-6 flex flex-col gap-6">
      {/* Company profile */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black text-white text-xs flex items-center justify-center">
              TB
            </div>
            <div>
              <p className="text-gray-900">Company Profile</p>
              <p className="text-[11px] text-gray-500">
                Teqbae corporate details and platform defaults
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConfiguring(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Icon icon="mdi:cog-outline" className="w-4 h-4" />
              Configure
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
              Edit Details
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-5">
          {TEQBAE_PROFILE.map((item) => (
            <div key={item.label}>
              <dt className="text-[11px] uppercase tracking-wider text-gray-500">
                {item.label}
              </dt>
              <dd className="text-sm text-gray-900 mt-1">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Modules */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-gray-900">Product Modules</p>
          <p className="text-[11px] text-gray-500">
            Control which modules can be assigned to clients
          </p>
        </div>
        <DataTable columns={columns} rows={modules} pageSize={5} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PAGE (sidebar + header come from MainLayout)                      */
/* ------------------------------------------------------------------ */

const TABS = [
  { label: "Clients", key: "clients" },
  { label: "Teqbae", key: "teqbae" },
];

function Configuration() {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem("configurationActiveTab");
      return TABS.some((t) => t.key === saved) ? saved : "clients";
    } catch {
      return "clients";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("configurationActiveTab", activeTab);
    } catch {
      /* ignore */
    }
  }, [activeTab]);

  return (
    <>
      <section className="bg-white mt-4 sm:mt-6 w-full px-4 sm:px-6">
        <div className="border-b flex flex-wrap gap-4 sm:gap-6 pt-4 text-sm">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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
        {activeTab === "clients" && <ClientsTab />}
        {activeTab === "teqbae" && <TeqbaeTab />}
      </div>
    </>
  );
}

export default Configuration;
