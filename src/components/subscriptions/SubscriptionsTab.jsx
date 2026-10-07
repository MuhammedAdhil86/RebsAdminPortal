import React, { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";

/* ------------------------------------------------------------------ */
/*  HELPERS + SHARED PIECES (also imported by the other files)        */
/* ------------------------------------------------------------------ */

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const money = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? `₹${n.toLocaleString("en-IN")}` : "—";
};

const STATUS_STYLES = {
  Active: "bg-green-50 text-green-700",
  Trial: "bg-blue-50 text-blue-700",
  Pending: "bg-blue-50 text-blue-700",
  Expired: "bg-amber-50 text-amber-700",
  Suspended: "bg-red-50 text-red-700",
  Cancelled: "bg-red-50 text-red-700",
};

export function StatusBadge({ status }) {
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

export function DataTable({
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

export function IconButton({ icon, label, onClick }) {
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

export function CompanyCell({ name, email }) {
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

export const SERVICE_COLUMNS = [
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

export const EXTENSION_COLUMNS = [
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
/*  SUBSCRIPTIONS TAB                                                 */
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
        <button
          type="button"
          onClick={() => onView(r)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-black text-white hover:bg-gray-800 transition-colors whitespace-nowrap"
        >
          <Icon icon="mdi:cog-outline" className="w-4 h-4" />
          Manage
        </button>
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

export default SubscriptionsTab;
