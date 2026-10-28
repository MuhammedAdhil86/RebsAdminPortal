import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Icon } from "@iconify/react";
import MasterDataTab from "../components/configpage/MasterDataTab"; // adjust path if needed
import DeleteConfirmModal from "../components/modals/DeleteConfirmModal"; // adjust path if needed
import {
  getActiveTenants,
  deleteTenantSubscription,
} from "../services/SubscriptionService"; // adjust path if needed

/* ------------------------------------------------------------------ */
/*  MOCK DATA (Teqbae tab only)                                       */
/* ------------------------------------------------------------------ */

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
  Pending: "bg-yellow-50 text-yellow-700",
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
/*  ACTION MENU (three horizontal dots → Update / Delete)             */
/*  Uses fixed positioning so the table's overflow doesn't clip it.   */
/* ------------------------------------------------------------------ */

function ActionMenu({ onUpdate, onDelete }) {
  const [pos, setPos] = useState(null); // { top, right } or null when closed
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const close = useCallback(() => setPos(null), []);

  const toggle = (e) => {
    e.stopPropagation();
    if (pos) return close();
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  };

  useEffect(() => {
    if (!pos) return undefined;
    const onDocClick = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        btnRef.current?.contains(e.target)
      )
        return;
      close();
    };
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos, close]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        title="More actions"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={!!pos}
        onClick={toggle}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
      >
        <Icon icon="mdi:dots-horizontal" className="w-[18px] h-[18px]" />
      </button>

      {pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: pos.top, right: pos.right }}
          className="z-[80] w-36 bg-white border border-gray-100 rounded-lg shadow-lg py-1 text-sm"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onUpdate();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 text-left"
          >
            <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
            Update
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onDelete();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 text-left"
          >
            <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 1: CLIENTS (data from company GET API)                        */
/* ------------------------------------------------------------------ */

const capitalize = (s = "") =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "Active";

const mapApiTenantToClient = (t) => ({
  id: t.company_id,
  name: t.company_name || "—",
  email: t.email || "—",
  contact: t.contact_person || "—",
  phone: t.phone_number || "—",
  organisationType: t.organisation_type || "—",
  status: capitalize(t.status || "ACTIVE"),
  raw: t,
});

function ClientsTab() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [deleteRequest, setDeleteRequest] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getActiveTenants();
      const list = Array.isArray(res) ? res : res?.data || [];
      setClients(list.map(mapApiTenantToClient));
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      setError("Failed to load clients. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  /* ---------- Delete (uses deleteTenantSubscription endpoint) ---------- */
  const promptDelete = (row) => {
    setDeleteRequest({
      singular: "Client",
      name: row.name,
      onConfirm: async () => {
        try {
          await deleteTenantSubscription(row.id);
          setClients((prev) => prev.filter((c) => c.id !== row.id));
          setToast(`Client "${row.name}" deleted successfully`);
          return true; // closes DeleteConfirmModal
        } catch (err) {
          console.error("Failed to delete client:", err);
          setToast("Failed to delete client. Please try again.");
          return false; // keeps modal open
        }
      },
    });
  };

  /* ---------- Update ---------- */
  const saveUpdate = (updated) => {
    // TODO: call your update endpoint here, e.g.
    // await updateTenant(updated.id, { ...payload });
    setClients((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
    setToast(`Client "${updated.name}" updated`);
    setEditingClient(null);
  };

  const statusOptions = useMemo(
    () => ["All", ...Array.from(new Set(clients.map((c) => c.status)))],
    [clients],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter(
      (c) =>
        (statusFilter === "All" || c.status === statusFilter) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.contact.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.organisationType.toLowerCase().includes(q)),
    );
  }, [clients, search, statusFilter]);

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
    {
      key: "contact",
      header: "Contact Person",
      className: "whitespace-nowrap",
    },
    { key: "phone", header: "Phone", className: "whitespace-nowrap" },
    {
      key: "organisationType",
      header: "Organization Type",
      className: "whitespace-nowrap",
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <ActionMenu
          onUpdate={() => setEditingClient(r)}
          onDelete={() => promptDelete(r)}
        />
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
              placeholder="Search by client name, email or contact"
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchClients}
            title="Refresh list"
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 transition-colors"
          >
            <Icon
              icon="mdi:refresh"
              className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
          >
            <Icon icon="mdi:plus" className="w-5 h-5" />
            Add Client
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Icon
            icon="eos-icons:loading"
            className="w-6 h-6 animate-spin text-gray-500 mb-2"
          />
          <p className="text-xs text-gray-500">Loading clients...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-red-100 shadow-sm">
          <p className="text-xs text-red-500 mb-3">{error}</p>
          <button
            onClick={fetchClients}
            className="px-3.5 py-1.5 text-xs bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          emptyText="No clients match your filters"
        />
      )}

      {/* Update modal */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSave={saveUpdate}
        />
      )}

      {/* Delete confirmation */}
      {deleteRequest && (
        <DeleteConfirmModal
          request={deleteRequest}
          onClose={() => setDeleteRequest(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[90] bg-black text-white text-xs px-4 py-3 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function EditClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState({
    name: client.name === "—" ? "" : client.name,
    email: client.email === "—" ? "" : client.email,
    contact: client.contact === "—" ? "" : client.contact,
    phone: client.phone === "—" ? "" : client.phone,
    organisationType:
      client.organisationType === "—" ? "" : client.organisationType,
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const fields = [
    ["name", "Company Name"],
    ["email", "Email"],
    ["contact", "Contact Person"],
    ["phone", "Phone"],
    ["organisationType", "Organization Type"],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base text-gray-900 font-semibold">
            Update Client
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            <Icon
              icon="heroicons:x-mark-20-solid"
              className="w-5 h-5 text-gray-400"
            />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map(([key, label]) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-gray-500">
                {label}
              </span>
              <input
                type="text"
                value={form[key]}
                onChange={set(key)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black"
              />
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave({ id: client.id, ...form })}
            className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 2: TEQBAE (OUR COMPANY) — UNCHANGED                           */
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

  if (isConfiguring) {
    return <MasterDataTab onCancel={() => setIsConfiguring(false)} />;
  }

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
