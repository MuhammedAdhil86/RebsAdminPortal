import React, { useEffect, useState, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import { UniversalTable, SearchBox, statusPill } from "./CompaniesTab";
import DeleteConfirmModal from "../modals/DeleteConfirmModal"; // adjust path as needed
import { getEnquiries, deleteEnquiry } from "../../services/Enquiries";
import { showSuccess, showError } from "../../utils/toest";
import ExcelJS from "exceljs";
import {
  titleStyle,
  headerStyle,
  textCellStyle,
  centerCellStyle,
} from "../../helpers/excelStyles"; // adjust path to where your styles file lives

/* ------------------------------------------------------------------ */
/*  HELPERS                                                           */
/* ------------------------------------------------------------------ */

// Local-date formatter (avoids UTC shift, e.g. IST) -> YYYY-MM-DD
const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Default range: 1st of current month -> today
const getDefaultRange = () => {
  const now = new Date();
  return {
    from: fmtDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: fmtDate(now),
  };
};

// ISO timestamp -> "02 Nov 2026" (local time, date only)
const fmtDateOnly = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ISO timestamp -> "22 Nov 2026, 09:14 PM" (local time)
const fmtDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Flatten one API enquiry into the shape the table columns use
const toRow = (e) => ({
  id: e.id,
  name: e.contact_person || "-",
  company: e.name || "-",
  email: e.email || "-",
  phone: e.phone_number || "-",
  type: e.organisation_type || "-",
  country: e.country || "-",
  address: e.address || "-",
  pan: e.pan || "-",
  website: e.website || "-",
  createdDate: fmtDateOnly(e.created_at),
  createdAt: fmtDateTime(e.created_at),
  updatedAt: fmtDateTime(e.updated_at),
  serviceList: Array.isArray(e.services) ? e.services.map((s) => s.name) : [],
  services: Array.isArray(e.services)
    ? e.services.map((s) => s.name).join(", ") || "-"
    : "-",
  isPaid: !!e.is_paid,
  status: e.is_paid ? "Paid" : "Unpaid",
});

// Excel export using the shared styles (includes every detail field)
const exportToExcel = async (rows, from, to, paymentLabel) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Enquiries");

  const wrapText = {
    ...textCellStyle.alignment,
    wrapText: true,
  };

  const headers = [
    {
      header: "CREATED AT",
      key: "createdAt",
      width: 24,
      style: centerCellStyle,
    },
    { header: "COMPANY", key: "company", width: 30, style: textCellStyle },
    { header: "CONTACT PERSON", key: "name", width: 24, style: textCellStyle },
    { header: "EMAIL", key: "email", width: 32, style: textCellStyle },
    { header: "PHONE NUMBER", key: "phone", width: 18, style: centerCellStyle },
    { header: "TYPE", key: "type", width: 18, style: centerCellStyle },
    { header: "SERVICES", key: "services", width: 24, style: textCellStyle },
    { header: "COUNTRY", key: "country", width: 14, style: centerCellStyle },
    {
      header: "ADDRESS",
      key: "address",
      width: 48,
      style: { ...textCellStyle, alignment: wrapText },
    },
    { header: "PAN", key: "pan", width: 16, style: centerCellStyle },
    { header: "WEBSITE", key: "website", width: 28, style: textCellStyle },
    {
      header: "UPDATED AT",
      key: "updatedAt",
      width: 24,
      style: centerCellStyle,
    },
    { header: "PAYMENT", key: "status", width: 14, style: centerCellStyle },
  ];
  const colCount = headers.length;

  // Row 1: title
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = "ENQUIRIES REPORT";
  titleCell.font = titleStyle.font;
  titleCell.alignment = titleStyle.alignment;

  // Row 2: filters used
  sheet.mergeCells(2, 1, 2, colCount);
  const rangeCell = sheet.getCell(2, 1);
  rangeCell.value = `From: ${from}    To: ${to}    Payment: ${paymentLabel}`;
  rangeCell.alignment = titleStyle.alignment;

  // Row 4: headers
  const headerRowIdx = 4;
  headers.forEach((h, i) => {
    const cell = sheet.getCell(headerRowIdx, i + 1);
    cell.value = h.header;
    cell.font = headerStyle.font;
    cell.alignment = headerStyle.alignment;
    cell.fill = headerStyle.fill;
    cell.border = headerStyle.border;
    sheet.getColumn(i + 1).width = h.width;
  });

  // Data rows
  rows.forEach((r, idx) => {
    headers.forEach((h, i) => {
      const cell = sheet.getCell(headerRowIdx + 1 + idx, i + 1);
      cell.value = r[h.key];
      cell.alignment = h.style.alignment;
      cell.border = h.style.border;
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `enquiries_${from}_to_${to}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ------------------------------------------------------------------ */
/*  DATE FIELD  (same look as the search field, calendar icon on right) */
/* ------------------------------------------------------------------ */

function DateField({ value, onChange, min, max, title }) {
  const inputRef = useRef(null);

  // Open the native calendar when anywhere in the field is clicked
  const openPicker = () => {
    const el = inputRef.current;
    if (el && typeof el.showPicker === "function") {
      try {
        el.showPicker();
      } catch {
        /* some browsers block showPicker outside user gestures */
      }
    }
  };

  return (
    <div className="relative flex-1 min-w-[112px] sm:flex-none sm:w-[124px]">
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        max={max}
        title={title}
        onClick={openPicker}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        style={{ colorScheme: "light", accentColor: "#000" }}
        className="w-full pl-2.5 pr-7 py-2 text-xs text-gray-800 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer focus:outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      />
      <Icon
        icon="solar:calendar-outline"
        className="w-3.5 h-3.5 text-gray-700 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SELECT FIELD  (same look, chevron icon on right)                  */
/* ------------------------------------------------------------------ */

function SelectField({ value, onChange, options, title }) {
  return (
    <div className="relative w-full sm:w-[140px]">
      <select
        value={value}
        title={title}
        onChange={(e) => onChange(e.target.value)}
        style={{ colorScheme: "light" }}
        className="w-full appearance-none pl-3 pr-9 py-2 text-xs text-gray-800 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer focus:outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon
        icon="solar:alt-arrow-down-outline"
        className="w-4 h-4 text-gray-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      />
    </div>
  );
}

const PAYMENT_OPTIONS = [
  { value: "all", label: "All Payments" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];

/* ------------------------------------------------------------------ */
/*  ENQUIRIES TAB                                                     */
/* ------------------------------------------------------------------ */

function EnquiriesTab() {
  const defaults = getDefaultRange();

  const [search, setSearch] = useState("");
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState(null); // null = all
  const [paymentFilter, setPaymentFilter] = useState("all"); // all | paid | unpaid
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [exporting, setExporting] = useState(false);

  // Delete modal request object: { singular, name, onConfirm } | null
  const [deleteRequest, setDeleteRequest] = useState(null);

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      // Sends: ?from=YYYY-MM-DD&to=YYYY-MM-DD
      const res = await getEnquiries({ from: fromDate, to: toDate });
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];

      setEnquiries(list.map(toRow));
    } catch {
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

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
          await deleteEnquiry(row.id, { silent: true });

          setEnquiries((prev) => prev.filter((item) => item.id !== row.id));

          showSuccess(`Enquiry for "${row.company}" deleted successfully`);

          return true; // closes modal on success
        } catch (err) {
          console.error("Failed to delete enquiry:", err);

          showError(
            err?.message || "Failed to delete enquiry. Please try again.",
          );

          return false; // keeps modal open if failed
        }
      },
    });
  };

  const q = search.toLowerCase();

  // Columns that fit the screen without scrolling.
  // Full details (country, address, PAN, website, updated) are in the Excel export.
  const columns = [
    { label: "Date", key: "createdDate", width: 110, align: "center" },
    { label: "Company", key: "company", width: 170, align: "left" },
    { label: "Contact Person", key: "name", width: 140, align: "center" },
    { label: "Email", key: "email", width: 210, align: "center" },
    { label: "Phone Number", key: "phone", width: 130, align: "center" },
    { label: "Type", key: "type", width: 100, align: "center" },
    { label: "Services", key: "services", width: 110, align: "center" },
    {
      label: "Payment",
      key: "status",
      width: 100,
      align: "center",
      render: (v) => statusPill(v),
    },
    {
      label: "Actions",
      key: "actions",
      width: 80,
      align: "center",
      render: (_, row) => (
        <div className="flex items-center justify-center gap-2">
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
      (paymentFilter === "all" ||
        (paymentFilter === "paid" ? r.isPaid : !r.isPaid)) &&
      (r.name.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.pan.toLowerCase().includes(q) ||
        r.website.toLowerCase().includes(q) ||
        r.createdDate.toLowerCase().includes(q) ||
        r.services.toLowerCase().includes(q)),
  );

  const handleExport = async () => {
    if (data.length === 0) {
      showError("No enquiries to export.");
      return;
    }
    setExporting(true);
    try {
      const paymentLabel =
        PAYMENT_OPTIONS.find((o) => o.value === paymentFilter)?.label || "All";
      await exportToExcel(data, fromDate, toDate, paymentLabel);
      showSuccess("Enquiries exported successfully");
    } catch (err) {
      console.error("Export failed:", err);
      showError("Failed to export enquiries.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex-1 grid grid-cols-[minmax(0,1fr)] gap-4 px-3 sm:px-4 pb-4 bg-[#f9fafb] rounded-xl w-full max-w-full min-w-0 mx-auto overflow-hidden font-[Poppins]">
      {/* Title & filters */}
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-3 pt-2 min-w-0">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-800">Enquiries</h3>
          <p className="text-[11px] text-gray-500 whitespace-nowrap truncate">
            Manage onboarding enquiries
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {/* Date range */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <DateField
              value={fromDate}
              max={toDate}
              onChange={setFromDate}
              title="From date"
            />
            <span className="text-xs text-gray-500">to</span>
            <DateField
              value={toDate}
              min={fromDate}
              onChange={setToDate}
              title="To date"
            />
          </div>

          {/* Payment status */}
          <SelectField
            value={paymentFilter}
            onChange={setPaymentFilter}
            options={PAYMENT_OPTIONS}
            title="Payment status"
          />

          {/* Search */}
          <div className="w-full sm:w-auto sm:flex-1 xl:flex-none min-w-[180px]">
            <SearchBox value={search} onChange={setSearch} />
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto"
            title="Export to Excel"
          >
            <Icon
              icon={exporting ? "eos-icons:loading" : "mdi:microsoft-excel"}
              className={`w-4 h-4 ${exporting ? "animate-spin" : ""}`}
            />
            Export
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
        <div className="p-8 sm:p-12 text-center bg-white rounded-lg shadow-sm border border-gray-100">
          <Icon
            icon="mdi:clipboard-text-off-outline"
            className="w-8 h-8 text-gray-400 mx-auto mb-2"
          />
          <p className="text-xs text-gray-500">
            {search || paymentFilter !== "all"
              ? "No enquiries match your filters."
              : "No enquiries found."}
          </p>
        </div>
      ) : (
        <div className="w-full min-w-0 overflow-hidden rounded-lg">
          <UniversalTable
            columns={columns}
            data={data}
            rowsPerPage={8}
            className="rounded-lg shadow-sm bg-white"
          />
        </div>
      )}

      {/* Standalone Portal Delete Confirm Modal */}
      {deleteRequest && (
        <DeleteConfirmModal
          request={deleteRequest}
          onClose={() => setDeleteRequest(null)}
        />
      )}
    </div>
  );
}

export default EnquiriesTab;
