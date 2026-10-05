import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { getTenantSubscriptions } from "../services/SubscriptionService"; // adjust path if needed

/* ------------------------------------------------------------------ */
/*  API:  GET /tenant/subscription/tenant-info                        */
/*  Response: { companies: [ { ..., subscription: {...} } ] }         */
/* ------------------------------------------------------------------ */

const SILENT = { silent: true };

const toCompanies = (res) =>
  res?.companies ||
  res?.data?.companies ||
  (Array.isArray(res) ? res : res?.data) ||
  [];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                           */
/* ------------------------------------------------------------------ */

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const money = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? `₹${n.toLocaleString("en-IN")}` : "—";
};

// "ACTIVE" -> "Active"
const statusLabel = (status = "") =>
  status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "—";

const STATUS_STYLES = {
  Active: "bg-green-50 text-green-700",
  Trial: "bg-blue-50 text-blue-700",
  Pending: "bg-blue-50 text-blue-700",
  Expired: "bg-amber-50 text-amber-700",
  Suspended: "bg-red-50 text-red-700",
  Cancelled: "bg-red-50 text-red-700",
};

/* Flatten API companies into table rows */
const toRows = (companies) =>
  companies.map((c) => {
    const sub = c.subscription || {};
    return {
      id: c.company_id,
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
/*  SHARED PIECES (same as Configuration page)                        */
/* ------------------------------------------------------------------ */

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
  loading = false,
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
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-14 text-center text-gray-400"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon icon="line-md:loading-loop" className="w-4 h-4" />
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : visible.length > 0 ? (
              visible.map((row, i) => (
                <tr
                  key={row.rowKey || row.id || i}
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

function CompanyCell({ name, email }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-black text-white text-xs flex items-center justify-center shrink-0">
        {initials(name)}
      </div>
      <div className="min-w-0">
        <p className="text-gray-900 truncate">{name}</p>
        {email && <p className="text-[11px] text-gray-500 truncate">{email}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  COLUMN DEFINITIONS (reused by list tabs and the detail view)      */
/* ------------------------------------------------------------------ */

const SERVICE_COLUMNS = [
  {
    key: "service_name",
    header: "Service",
    render: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-black text-white text-xs flex items-center justify-center shrink-0">
          {initials(r.service_name)}
        </div>
        <div className="min-w-0">
          <p className="text-gray-900">{r.service_name}</p>
          <p className="text-[11px] text-gray-500 font-mono">
            {r.service_code}
          </p>
        </div>
      </div>
    ),
  },
  { key: "included_users", header: "Included Users" },
  {
    key: "base_amount",
    header: "Base Amount",
    className: "whitespace-nowrap",
    render: (r) => money(r.base_amount),
  },
  {
    key: "additional_user_price",
    header: "Additional User Price",
    className: "whitespace-nowrap",
    render: (r) => money(r.additional_user_price),
  },
];

const EXTENSION_COLUMNS = [
  {
    key: "service_name",
    header: "Service",
    render: (r) => (
      <div className="min-w-0">
        <p className="text-gray-900">{r.service_name}</p>
        <p className="text-[11px] text-gray-500 font-mono">{r.service_code}</p>
      </div>
    ),
  },
  { key: "additional_users", header: "Additional Users" },
  {
    key: "unit_price",
    header: "Unit Price",
    className: "whitespace-nowrap",
    render: (r) => money(r.unit_price),
  },
  {
    key: "total_amount",
    header: "Total Amount",
    className: "whitespace-nowrap",
    render: (r) => money(r.total_amount),
  },
  {
    key: "start_date",
    header: "Start",
    className: "whitespace-nowrap",
    render: (r) => formatDate(r.start_date),
  },
  {
    key: "end_date",
    header: "End",
    className: "whitespace-nowrap",
    render: (r) => formatDate(r.end_date),
  },
];

/* ------------------------------------------------------------------ */
/*  TAB 1: SUBSCRIPTIONS                                              */
/* ------------------------------------------------------------------ */

function SubscriptionsTab({ rows, loading, onView }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statusOptions = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((r) => r.status)))],
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (statusFilter === "All" || r.status === statusFilter) &&
        (!q ||
          r.name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.planName?.toLowerCase().includes(q)),
    );
  }, [rows, search, statusFilter]);

  const columns = [
    {
      key: "name",
      header: "Company",
      render: (r) => <CompanyCell name={r.name} email={r.email} />,
    },
    {
      key: "planName",
      header: "Plan",
      render: (r) => (
        <div className="min-w-0">
          <p className="text-gray-900 whitespace-nowrap">{r.planName || "—"}</p>
          <p className="text-[11px] text-gray-500 font-mono">{r.planCode}</p>
        </div>
      ),
    },
    {
      key: "billingPeriod",
      header: "Billing",
      className: "whitespace-nowrap",
      render: (r) => r.billingPeriod || "—",
    },
    {
      key: "services",
      header: "Services",
      render: (r) => (
        <div className="flex flex-wrap gap-1.5">
          {r.services.length === 0 ? (
            <span className="text-gray-400">—</span>
          ) : (
            r.services.map((s) => (
              <span
                key={s.service_id}
                className="px-2 py-0.5 rounded-md bg-gray-100 text-[11px] text-gray-700"
              >
                {s.service_code || s.service_name}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "endDate",
      header: "Valid Till",
      className: "whitespace-nowrap",
      render: (r) => formatDate(r.endDate),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1">
          <IconButton
            icon="mdi:eye-outline"
            label="View details"
            onClick={() => onView(r)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 sm:px-6 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Icon
            icon="mdi:magnify"
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, email or plan"
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-black"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyText="No subscriptions match your filters"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 2: SERVICES (all companies)                                   */
/* ------------------------------------------------------------------ */

function ServicesTab({ rows, loading }) {
  const serviceRows = useMemo(
    () =>
      rows.flatMap((r) =>
        r.services.map((s) => ({
          ...s,
          rowKey: `${r.id}-${s.service_id}`,
          companyName: r.name,
          companyEmail: r.email,
        })),
      ),
    [rows],
  );

  const columns = [
    {
      key: "companyName",
      header: "Company",
      render: (r) => (
        <CompanyCell name={r.companyName} email={r.companyEmail} />
      ),
    },
    ...SERVICE_COLUMNS,
  ];

  return (
    <div className="px-4 sm:px-6 flex flex-col gap-3">
      <div>
        <p className="text-gray-900">Subscribed Services</p>
        <p className="text-[11px] text-gray-500">
          Services included in each company's subscription
        </p>
      </div>
      <DataTable
        columns={columns}
        rows={serviceRows}
        loading={loading}
        emptyText="No services found"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 3: USER EXTENSIONS (all companies)                            */
/* ------------------------------------------------------------------ */

function UserExtensionsTab({ rows, loading }) {
  const extensionRows = useMemo(
    () =>
      rows.flatMap((r) =>
        r.userExtensions.map((e, i) => ({
          ...e,
          rowKey: `${r.id}-${e.service_id}-${i}`,
          companyName: r.name,
          companyEmail: r.email,
        })),
      ),
    [rows],
  );

  const columns = [
    {
      key: "companyName",
      header: "Company",
      render: (r) => (
        <CompanyCell name={r.companyName} email={r.companyEmail} />
      ),
    },
    ...EXTENSION_COLUMNS,
  ];

  return (
    <div className="px-4 sm:px-6 flex flex-col gap-3">
      <div>
        <p className="text-gray-900">User Extensions</p>
        <p className="text-[11px] text-gray-500">
          Additional users purchased on top of the included limit
        </p>
      </div>
      <DataTable
        columns={columns}
        rows={extensionRows}
        loading={loading}
        emptyText="No user extensions found"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DETAIL VIEW (opened from the View action, Back returns to list)   */
/* ------------------------------------------------------------------ */

function SubscriptionDetail({ row, onBack }) {
  const info = [
    { label: "Plan", value: row.planName },
    { label: "Plan Code", value: row.planCode },
    {
      label: "Billing Period",
      value: row.billingPeriod
        ? `${row.billingPeriod}${row.billingMonths ? ` (${row.billingMonths} mo)` : ""}`
        : "—",
    },
    { label: "Start Date", value: formatDate(row.startDate) },
    { label: "Base End Date", value: formatDate(row.baseEndDate) },
    { label: "Extension", value: `${row.extensionDays} days` },
    { label: "End Date", value: formatDate(row.endDate) },
    { label: "Country", value: row.country },
    { label: "Organisation Type", value: row.organisationType },
    { label: "Contact Person", value: row.contactPerson },
    { label: "Phone", value: row.phone },
  ];

  const serviceRows = row.services.map((s) => ({
    ...s,
    rowKey: `${row.id}-${s.service_id}`,
  }));
  const extensionRows = row.userExtensions.map((e, i) => ({
    ...e,
    rowKey: `${row.id}-${e.service_id}-${i}`,
  }));

  return (
    <div className="px-4 sm:px-6 flex flex-col gap-6">
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
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

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-5">
          {info.map((item) => (
            <div key={item.label}>
              <dt className="text-[11px] uppercase tracking-wider text-gray-500">
                {item.label}
              </dt>
              <dd className="text-sm text-gray-900 mt-1">
                {item.value || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </div>

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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PAGE (sidebar + header come from MainLayout)                      */
/* ------------------------------------------------------------------ */

const TABS = [
  { label: "Subscriptions", key: "subscriptions" },
  { label: "Services", key: "services" },
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
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load subscriptions.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          <SubscriptionDetail row={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            {activeTab === "subscriptions" && (
              <SubscriptionsTab
                rows={rows}
                loading={loading}
                onView={setSelected}
              />
            )}
            {activeTab === "services" && (
              <ServicesTab rows={rows} loading={loading} />
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
