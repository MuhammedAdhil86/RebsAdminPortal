import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import {
  UniversalTable,
  SearchBox,
  statusPill,
  nameCell,
} from "./CompaniesTab";
import DeleteConfirmModal from "../modals/DeleteConfirmModal"; // adjust path as needed
import { getEnquiries, deleteEnquiry } from "../../services/Enquiries";

/* ------------------------------------------------------------------ */
/*  HELPERS                                                           */
/* ------------------------------------------------------------------ */

// Flatten one API enquiry into the shape the table columns use
const toRow = (e) => ({
  id: e.id,
  name: e.contact_person || "-",
  company: e.name || "-",
  email: e.email || "-",
  phone: e.phone_number || "-",
  type: e.organisation_type || "-",
  serviceList: Array.isArray(e.services) ? e.services.map((s) => s.name) : [],
  services: Array.isArray(e.services)
    ? e.services.map((s) => s.name).join(", ") || "-"
    : "-",
  isPaid: !!e.is_paid,
  status: e.is_paid ? "Paid" : "Unpaid",
});

/* ------------------------------------------------------------------ */
/*  ENQUIRIES TAB                                                     */
/* ------------------------------------------------------------------ */

function EnquiriesTab() {
  const [search, setSearch] = useState("");
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState(null); // null = all

  // Delete modal request object: { singular, name, onConfirm } | null
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEnquiries();
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];
      setEnquiries(list.map(toRow));
    } catch {
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  // Triggers the DeleteConfirmModal
  const promptDelete = (row) => {
    setDeleteRequest({
      singular: "Enquiry",
      name: row.company || row.name,
      onConfirm: async () => {
        try {
          await deleteEnquiry(row.id);
          setEnquiries((prev) => prev.filter((item) => item.id !== row.id));
          setToast(`Enquiry for "${row.company}" deleted successfully`);
          return true; // closes modal on success
        } catch (err) {
          console.error("Failed to delete enquiry:", err);
          setToast("Failed to delete enquiry. Please try again.");
          return false; // keeps modal open if failed
        }
      },
    });
  };

  const q = search.toLowerCase();

  const columns = [
    { label: "Contact", key: "name", width: 160, render: nameCell },
    { label: "Company", key: "company", width: 170 },
    { label: "Email", key: "email", width: 220 },
    { label: "Type", key: "type", width: 180 },
    { label: "Services", key: "services", width: 150 },
    {
      label: "Payment",
      key: "status",
      width: 110,
      render: (v) => statusPill(v),
    },
    {
      label: "Actions",
      key: "actions",
      width: 90,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => promptDelete(row)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Enquiry"
          >
            <Icon icon="heroicons:trash-20-solid" className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const data = enquiries.filter(
    (r) =>
      (!serviceFilter || r.serviceList.includes(serviceFilter)) &&
      (r.name.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)),
  );

  return (
    <div className="flex-1 grid grid-cols-1 gap-4 px-4 pb-4 bg-[#f9fafb] rounded-xl w-full mx-auto font-[Poppins]">
      {/* Title & Search bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Enquiries</h3>
          <p className="text-[11px] text-gray-500">
            Manage incoming tenant and customer onboarding enquiries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SearchBox value={search} onChange={setSearch} />
          <button
            onClick={loadEnquiries}
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
          <p className="text-xs text-gray-500">Loading enquiries...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg shadow-sm border border-gray-100">
          <Icon
            icon="mdi:clipboard-text-off-outline"
            className="w-8 h-8 text-gray-400 mx-auto mb-2"
          />
          <p className="text-xs text-gray-500">
            {search
              ? "No enquiries match your search query."
              : "No enquiries found."}
          </p>
        </div>
      ) : (
        <UniversalTable
          columns={columns}
          data={data}
          rowsPerPage={8}
          className="rounded-lg shadow-sm bg-white"
        />
      )}

      {/* Standalone Portal Delete Confirm Modal */}
      {deleteRequest && (
        <DeleteConfirmModal
          request={deleteRequest}
          onClose={() => setDeleteRequest(null)}
        />
      )}

      {/* Feedback Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] bg-black text-white text-xs px-4 py-3 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default EnquiriesTab;
