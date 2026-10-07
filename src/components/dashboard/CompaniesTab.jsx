import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Search } from "lucide-react";
import DashboardTable from "../../utils/DashboardTable";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal"; // adjust path to DeleteConfirmModal if needed
import {
  getActiveTenants,
  deleteTenantSubscription,
} from "../../services/SubscriptionService";

/* ------------------------------------------------------------------ */
/*  LEGACY EXPORT STUBS (Prevents other dashboard imports from breaking)*/
/* ------------------------------------------------------------------ */
export const COMPANY_ONBOARDING = [];
export const INITIAL_USERS = [];
export const USER_ONBOARDING = [];

/* ------------------------------------------------------------------ */
/*  HELPERS & RENDERERS                                               */
/* ------------------------------------------------------------------ */

export const initials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

export const avatar = (id) => `https://i.pravatar.cc/40?u=${id}`;

export const statusPill = (val) => {
  const map = {
    Active: "bg-green-100 text-green-600",
    ACTIVE: "bg-green-100 text-green-600",
    Pending: "bg-yellow-100 text-yellow-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    Suspended: "bg-red-100 text-red-600",
    SUSPENDED: "bg-red-100 text-red-600",
    Online: "bg-green-100 text-green-600",
    Completed: "bg-green-100 text-green-600",
    "In Progress": "bg-blue-100 text-blue-600",
    Overdue: "bg-red-100 text-red-600",
    "Due Soon": "bg-yellow-100 text-yellow-700",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-[12px] font-medium capitalize ${
        map[val] || "bg-gray-100 text-gray-600"
      }`}
    >
      {val?.toLowerCase()}
    </span>
  );
};

export const nameCell = (val, row = {}) => (
  <div className="flex items-center gap-2">
    <img
      src={row.image || avatar(row.id || val)}
      alt={val || "avatar"}
      className="w-8 h-8 rounded-full object-cover border"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          val || "User",
        )}&background=random`;
      }}
    />
    <span className="truncate max-w-[140px] font-medium">{val || "—"}</span>
  </div>
);

export const companyCell = (val) => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-full bg-black text-white text-[11px] font-medium flex items-center justify-center shrink-0">
      {initials(val)}
    </div>
    <span className="truncate max-w-[200px] font-medium text-gray-900">
      {val}
    </span>
  </div>
);

export const progressCell = (val) => (
  <div className="flex items-center gap-2 min-w-[120px]">
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-black rounded-full"
        style={{ width: `${val}%` }}
      />
    </div>
    <span className="text-[11px] text-gray-500 w-8 text-right">{val}%</span>
  </div>
);

export function SearchBox({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 border px-2.5 py-1.5 rounded-lg bg-gray-50 text-xs w-48 sm:w-60 focus-within:border-black transition-colors">
      <input
        type="text"
        placeholder="Search company, contact, email..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent w-full focus:outline-none text-xs placeholder:text-gray-400 text-gray-800"
      />
      <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 font-[Poppins]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base text-gray-900 font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Icon
              icon="heroicons:x-mark-20-solid"
              className="w-5 h-5 text-gray-400"
            />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export { DashboardTable as UniversalTable };

/* ------------------------------------------------------------------ */
/*  DATA ADAPTER FOR API TENANTS                                      */
/* ------------------------------------------------------------------ */

const mapApiTenantToCompany = (t) => ({
  id: t.company_id,
  company: t.company_name,
  contact: t.contact_person || "—",
  email: t.email || "—",
  phone: t.phone_number || "—",
  address: t.address || "—",
  organisationType: t.organisation_type || "—",
  status: t.status || "ACTIVE",
  raw: t,
});

/* ------------------------------------------------------------------ */
/*  MAIN COMPANIES TAB COMPONENT                                      */
/* ------------------------------------------------------------------ */

export function CompaniesTab() {
  const [companiesList, setCompaniesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Delete modal state
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getActiveTenants();
      const list = Array.isArray(res) ? res : res?.data || [];
      setCompaniesList(list.map(mapApiTenantToCompany));
    } catch (err) {
      console.error("Failed to fetch active tenants:", err);
      setError("Failed to load active companies. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Connect Delete Modal to deleteTenantSubscription API
  const promptDeleteCompany = (row) => {
    setDeleteRequest({
      singular: "Company",
      name: row.company,
      onConfirm: async () => {
        try {
          await deleteTenantSubscription(row.id);
          // Remove from local list immediately
          setCompaniesList((prev) => prev.filter((item) => item.id !== row.id));
          setToast(`Company "${row.company}" deleted successfully`);
          return true; // closes DeleteConfirmModal
        } catch (err) {
          console.error("Failed to delete company:", err);
          setToast("Failed to delete company. Please try again.");
          return false; // keeps modal open
        }
      },
    });
  };

  const q = search.toLowerCase();

  const filteredCompanies = companiesList.filter(
    (c) =>
      c.company?.toLowerCase().includes(q) ||
      c.contact?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.organisationType?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q),
  );

  const columns = [
    { label: "Company", key: "company", width: 220, render: companyCell },
    { label: "Contact Person", key: "contact", width: 150 },
    { label: "Email", key: "email", width: 200 },
    { label: "Phone", key: "phone", width: 140 },
    { label: "Organization Type", key: "organisationType", width: 190 },
    { label: "Address", key: "address", width: 180 },
    {
      label: "Status",
      key: "status",
      width: 100,
      render: (v) => statusPill(v),
    },
    {
      label: "Actions",
      key: "actions",
      width: 80,
      render: (_, row) => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              promptDeleteCompany(row);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title={`Delete ${row.company}`}
          >
            <Icon icon="heroicons:trash-20-solid" className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 grid grid-cols-1 gap-4 px-4 pb-4 bg-[#f9fafb] rounded-xl w-full mx-auto font-[Poppins]">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Active Companies
          </h2>
          <p className="text-[11px] text-gray-500">
            Overview of all active tenant organizations registered in the system
          </p>
        </div>

        <div className="flex items-center gap-2">
          <SearchBox value={search} onChange={setSearch} />
          <button
            onClick={fetchCompanies}
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 transition-colors shadow-sm"
            title="Refresh list"
          >
            <Icon
              icon="mdi:refresh"
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Table & States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm border border-gray-100">
          <Icon
            icon="eos-icons:loading"
            className="w-6 h-6 animate-spin text-gray-500 mb-2"
          />
          <p className="text-xs text-gray-500">Loading active companies...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-red-100">
          <p className="text-xs text-red-500 mb-3">{error}</p>
          <button
            onClick={fetchCompanies}
            className="px-3.5 py-1.5 text-xs bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <DashboardTable
          columns={columns}
          data={filteredCompanies}
          rowsPerPage={8}
          className="rounded-lg shadow-sm bg-white"
        />
      )}

      {/* Portal-based Delete Confirmation Modal */}
      {deleteRequest && (
        <DeleteConfirmModal
          request={deleteRequest}
          onClose={() => setDeleteRequest(null)}
        />
      )}

      {/* Action Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] bg-black text-white text-xs px-4 py-3 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default CompaniesTab;
