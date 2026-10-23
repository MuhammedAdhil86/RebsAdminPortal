import React, { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import { bulkAddUsers, isCanceled } from "../../services/PolicyService"; // adjust path

const MAX_SIZE_MB = 5;

// Column names exactly as the backend expects them in the CSV header row
const CSV_COLUMNS = [
  "first_name",
  "last_name",
  "nick_name",
  "email",
  "ph_no",
  "basic_salary",
  "salary_period",
  "account_holder_name",
  "account_number",
  "ifsc",
  "bank_name",
  "bank_branch",
];

const SAMPLE_ROW = [
  "Anita",
  "Menon",
  "Ani",
  "anita@example.com",
  "9876543210",
  "30000",
  "monthly",
  "Anita Menon",
  "123456789012",
  "SBIN0000001",
  "State Bank of India",
  "Kochi",
].join(",");

const errorMessage = (err, fallback) =>
  err?.data?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;

const formatSize = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const downloadTemplate = () => {
  const csv = `${CSV_COLUMNS.join(",")}\n${SAMPLE_ROW}\n`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "employees-template.csv";
  a.click();
  URL.revokeObjectURL(url);
};

// Reads only the first line of the file and compares it to the expected columns
const checkHeader = async (file) => {
  const text = await file.slice(0, 4096).text();
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/)[0] || "";
  const found = firstLine
    .split(",")
    .map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());
  const missing = CSV_COLUMNS.filter((c) => !found.includes(c));
  return missing;
};

/* props:
     companyId   – required
     companyName – optional
     onSaved     – optional; called after a fully successful upload
                   (CompanyDetailsView reloads the list and returns to Employees) */
export default function AddEmployeeTab({ companyId, companyName, onSaved }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { message, errors: string[] }

  const reset = () => {
    setFile(null);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const pickFile = async (f) => {
    setError(null);
    setResult(null);
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) {
      setFile(null);
      return setError("Only .csv files are supported.");
    }
    if (f.size === 0) {
      setFile(null);
      return setError("The selected file is empty.");
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setFile(null);
      return setError(`File is larger than ${MAX_SIZE_MB} MB.`);
    }
    try {
      const missing = await checkHeader(f);
      if (missing.length > 0) {
        setFile(null);
        return setError(
          `Missing columns in the header row: ${missing.join(", ")}`,
        );
      }
    } catch {
      // If the header can't be read, let the server validate it
    }
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (companyId == null) return setError("Company is missing.");
    if (!file) return setError("Please choose a CSV file to upload.");

    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await bulkAddUsers(companyId, file, { silent: true });
      const body = res?.data ?? res ?? {};
      if (body?.success === false) {
        throw new Error(body?.message || "Failed to upload employees.");
      }

      const rowErrors = Array.isArray(body?.errors)
        ? body.errors.map((x) =>
            typeof x === "string" ? x : x?.message || JSON.stringify(x),
          )
        : [];
      const message = body?.message || "Employees uploaded successfully";

      if (rowErrors.length > 0) {
        // Partly failed: stay here so the person can read the problems
        setResult({ message, errors: rowErrors });
        toast.warning(message);
      } else {
        toast.success(message);
        reset();
        onSaved?.();
      }
    } catch (err) {
      if (!isCanceled(err)) {
        console.error("[AddEmployeeTab] bulk upload failed", {
          message: err?.message,
          status: err?.status ?? err?.response?.status,
        });
        setError(errorMessage(err, "Failed to upload employees."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-gray-500">
          Upload a CSV to add employees to {companyName || "this company"}
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 shadow-sm"
        >
          <Icon icon="mdi:download-outline" className="w-4 h-4" />
          Download template
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pickFile(e.dataTransfer.files?.[0]);
        }}
        className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-12 rounded-xl border border-dashed text-center transition-colors ${
          dragging ? "border-black bg-gray-50" : "border-gray-300 bg-[#F4F6F8]"
        }`}
      >
        <Icon
          icon="mdi:file-delimited-outline"
          className="w-8 h-8 text-gray-500"
        />
        {file ? (
          <div className="flex items-center gap-2 text-xs text-gray-900">
            <span className="font-medium">{file.name}</span>
            <span className="text-gray-500">({formatSize(file.size)})</span>
            <button
              type="button"
              onClick={reset}
              disabled={submitting}
              aria-label="Remove file"
              className="p-1 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-50"
            >
              <Icon icon="mdi:close" className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-700">Drag a CSV file here, or</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-1.5 text-xs border border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-gray-700"
            >
              Choose file
            </button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          aria-label="CSV file"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <p className="text-[10px] text-gray-500">
          .csv only, up to {MAX_SIZE_MB} MB
        </p>
      </div>

      <div className="text-[10px] text-gray-500">
        <p className="mb-1">The first row must contain these columns:</p>
        <p className="font-mono leading-relaxed break-words">
          {CSV_COLUMNS.join(", ")}
        </p>
      </div>

      {error && (
        <p className="text-[11px] text-red-600" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-800"
          role="alert"
        >
          <p className="font-medium">{result.message}</p>
          <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[10px] text-amber-700 max-h-40 overflow-y-auto">
            {result.errors.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting || !file}
          className="px-6 py-2 bg-black text-white rounded-xl text-xs hover:bg-zinc-800 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Uploading..." : "Upload employees"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={submitting || (!file && !error && !result)}
          className="px-6 py-2 border border-gray-300 rounded-xl text-xs hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
