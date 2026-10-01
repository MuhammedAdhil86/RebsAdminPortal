import React, { useEffect, useMemo, useState } from "react";
import {
  UniversalTable,
  SearchBox,
  statusPill,
  nameCell,
} from "./CompaniesTab"; // shared table / search / cells live in CompaniesTab.jsx
import { getEnquiries } from "../../services/Enquiries"; // adjust to your actual filename

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
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

// Small dashboard card; clickable when `onClick` is given
function StatCard({ label, value, active, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex flex-col items-start rounded-lg border bg-white px-4 py-3 text-left shadow-sm transition-colors ${
        active ? "border-black ring-1 ring-black" : "border-gray-200"
      } ${onClick ? "cursor-pointer hover:border-gray-400" : ""}`}
    >
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-2xl text-gray-800">{value}</span>
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  ENQUIRIES TAB                                                      */
/* ------------------------------------------------------------------ */

function EnquiriesTab() {
  const [search, setSearch] = useState("");
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState(null); // null = all

  // Errors are toasted globally by the axios interceptor, so no toast here.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await getEnquiries();
        const list = Array.isArray(res) ? res : res?.items || [];
        if (!cancelled) setEnquiries(list.map(toRow));
      } catch {
        if (!cancelled) setEnquiries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = search.toLowerCase();

  // Dashboard numbers, derived from the loaded enquiries
  const stats = useMemo(() => {
    const perService = {};
    enquiries.forEach((r) =>
      r.serviceList.forEach((n) => {
        perService[n] = (perService[n] || 0) + 1;
      }),
    );
    return {
      total: enquiries.length,
      paid: enquiries.filter((r) => r.isPaid).length,
      perService: Object.entries(perService).sort((a, b) => b[1] - a[1]),
    };
  }, [enquiries]);

  const columns = [
    { label: "Contact", key: "name", width: 160, render: nameCell },
    { label: "Company", key: "company", width: 170 },
    { label: "Email", key: "email", width: 220 },
    { label: "Type", key: "type", width: 190 },
    { label: "Services", key: "services", width: 150 },
    {
      label: "Payment",
      key: "status",
      width: 110,
      render: (v) => statusPill(v),
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-base text-gray-800">Enquiries</h3>
        <SearchBox value={search} onChange={setSearch} />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500">
          Loading enquiries...
        </p>
      ) : data.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">
          {search ? "No enquiries match your search." : "No enquiries yet."}
        </p>
      ) : (
        <UniversalTable
          columns={columns}
          data={data}
          rowsPerPage={8}
          className="rounded-lg shadow-sm"
        />
      )}
    </div>
  );
}

export default EnquiriesTab;
