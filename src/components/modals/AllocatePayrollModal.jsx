import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import { getStaffList, isCanceled } from "../../services/PolicyService"; // adjust path
import { allocateSalaryTemplate } from "../../services/PayrollService"; // adjust path
import CustomSelect from "./ui/CustomSelect"; // adjust path

const globalFont = "font-['Poppins'] font-normal text-[12px]";

// One size/look for every input in the modal (matches CustomSelect)
const inputCls =
  "w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-black transition-all disabled:bg-gray-50 disabled:text-gray-400";

// Date inputs: hide the browser's own calendar icon (we draw ours on the
// left) and open the picker when the field is clicked instead.
const dateInputCls = `${inputCls} pl-9 [&::-webkit-calendar-picker-indicator]:hidden`;

const errorMessage = (err, fallback) =>
  err?.data?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "?";

// Local "YYYY-MM-DD" for today (no UTC shifting)
const todayStr = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

// "percentage_ctc" + 50 -> "50% of CTC", "flat" + 250 -> "₹250"
const describeMapping = (m) => {
  if (m.calculation_type === "percentage_ctc") return `${m.value}% of CTC`;
  if (m.calculation_type === "flat") return formatINR(m.value);
  return `${m.value} (${String(m.calculation_type || "").replace(/_/g, " ")})`;
};

/**
 * Allocate a salary template to one or more staff.
 *
 * Props:
 *  - open               boolean
 *  - onClose            () => void
 *  - onSuccess          ({ userIds, templateId, effectiveFrom, effectiveTo }) => void
 *  - companyId          number | string   (sent as company_id)
 *  - templates          array from getSalaryTemplates (loaded by the parent tab)
 *  - templatesLoading   optional boolean
 *  - templateId         optional. Preselects a template.
 *  - defaultStaffId     optional. Staff pre-ticked in the list (can be changed).
 *  - canSelectMultiple  privilege flag (default true). true -> Individual / Bulk
 *                       toggle is shown. false -> individual allocation only.
 *
 * Payloads:
 *  Single -> { company_id, template_id, user_id,  effective_from, effective_to? }
 *  Bulk   -> { company_id, template_id, user_ids, effective_from, effective_to? }
 */
export default function AllocatePayrollModal({
  open,
  onClose,
  onSuccess,
  companyId,
  templates = [],
  templatesLoading = false,
  templateId: templateIdProp,
  defaultStaffId,
  canSelectMultiple = true,
}) {
  // "single" | "multiple"
  const [mode, setMode] = useState("single");
  const isMultiple = canSelectMultiple && mode === "multiple";

  const [staff, setStaff] = useState({
    loading: false,
    error: null,
    users: [],
  });
  const [staffReload, setStaffReload] = useState(0);

  const [templateId, setTemplateId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayStr());
  const [effectiveTo, setEffectiveTo] = useState("");

  const [selected, setSelected] = useState([]); // uuid strings
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reset every time the modal opens
  useEffect(() => {
    if (!open) return;
    setMode("single");
    setSelected(defaultStaffId ? [String(defaultStaffId)] : []);
    setQuery("");
    setError(null);
    setSubmitting(false);
    setEffectiveFrom(todayStr());
    setEffectiveTo("");
    setTemplateId(templateIdProp != null ? String(templateIdProp) : "");
  }, [open, templateIdProp, defaultStaffId]);

  // Preselect the first template when none was passed in
  useEffect(() => {
    if (!open || templateIdProp != null || templates.length === 0) return;
    setTemplateId((cur) => cur || String(templates[0].id));
  }, [open, templateIdProp, templates]);

  // Load staff when opened
  useEffect(() => {
    if (!open || companyId == null) return undefined;
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      setStaff((s) => ({ ...s, loading: true, error: null }));
      try {
        const { users } = await getStaffList(companyId, {
          signal,
          silent: true,
        });
        setStaff({ loading: false, error: null, users });
      } catch (err) {
        if (signal.aborted || isCanceled(err)) return;
        console.error("[AllocatePayrollModal] staff load failed", err);
        setStaff({
          loading: false,
          error: errorMessage(err, "Failed to load staff."),
          users: [],
        });
      }
    })();

    return () => controller.abort();
  }, [open, companyId, staffReload]);

  // Escape to close + lock body scroll while open
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, submitting, onClose]);

  const templateOptions = useMemo(
    () => [
      {
        value: "",
        label: templatesLoading ? "Loading templates..." : "Select a template",
      },
      ...templates.map((t) => ({
        value: String(t.id),
        label: `${t.name} – ${formatINR(t.annual_ctc)}`,
      })),
    ],
    [templates, templatesLoading],
  );

  const selectedTemplate = useMemo(
    () => templates.find((t) => String(t.id) === String(templateId)) || null,
    [templates, templateId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff.users;
    return staff.users.filter((u) =>
      [u.name, u.uuid, u.department, u.designation, u.branch]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [staff.users, query]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((u) => selectedSet.has(String(u.uuid)));

  if (!open) return null;

  // Single mode behaves like a radio group; multiple mode toggles
  const toggle = (id) =>
    setSelected((prev) => {
      if (!isMultiple) return [id];
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });

  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const ids = filtered.map((u) => String(u.uuid));
      if (allFilteredSelected) return prev.filter((id) => !ids.includes(id));
      return [...new Set([...prev, ...ids])];
    });

  const switchMode = (next) => {
    setMode(next);
    // Going back to single keeps just one selection
    if (next === "single") setSelected((prev) => prev.slice(0, 1));
  };

  const openPicker = (e) => {
    try {
      e.currentTarget.showPicker?.();
    } catch {
      /* some browsers only allow showPicker from a user gesture; ignore */
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!templateId) return setError("Please choose a salary template.");
    if (!effectiveFrom) return setError("Choose an effective from date.");
    if (effectiveTo && effectiveTo < effectiveFrom)
      return setError("Effective to cannot be before effective from.");
    if (selected.length === 0)
      return setError("Select at least one staff member.");

    setSubmitting(true);
    setError(null);
    try {
      await allocateSalaryTemplate(
        {
          companyId,
          templateId,
          userIds: selected,
          effectiveFrom,
          effectiveTo: effectiveTo || null,
          bulk: isMultiple,
        },
        { silent: true },
      );

      toast.success(
        `Salary template allocated to ${selected.length} staff member${
          selected.length > 1 ? "s" : ""
        }`,
      );
      onSuccess?.({
        userIds: selected,
        templateId,
        effectiveFrom,
        effectiveTo: effectiveTo || null,
      });
      onClose();
    } catch (err) {
      if (isCanceled(err)) return;
      console.error("[AllocatePayrollModal] allocate failed", err);
      setError(errorMessage(err, "Failed to allocate salary template."));
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${globalFont}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="allocate-payroll-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !submitting && onClose()}
      />

      {/* Panel */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white border border-gray-200 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
              <Icon icon="mdi:cash-multiple" className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2
                id="allocate-payroll-title"
                className="text-[14px] font-semibold text-gray-900 leading-tight"
              >
                Allocate salary template
              </h2>
              <p className="text-[11px] text-gray-500 truncate">
                {selectedTemplate?.name || "Assign a salary template to staff"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <Icon icon="mdi:close" className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-3 flex flex-col gap-3 min-h-0 overflow-y-auto">
          {/* Template */}
          <div>
            <span className="block text-[11px] text-gray-700 mb-1.5">
              Salary template
            </span>
            <CustomSelect
              fullWidth
              ariaLabel="Salary template"
              value={templateId}
              options={templateOptions}
              onChange={setTemplateId}
              disabled={templatesLoading}
            />
            {!templatesLoading && templates.length === 0 && (
              <p className="mt-1.5 text-[11px] text-gray-500">
                No salary templates available for this company.
              </p>
            )}

            {selectedTemplate && (
              <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#F4F6F8]">
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-gray-900 truncate">
                      {selectedTemplate.name}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {selectedTemplate.description || "No description"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">
                      Annual CTC
                    </p>
                    <p className="text-[12px] font-semibold text-gray-900">
                      {formatINR(selectedTemplate.annual_ctc)}
                    </p>
                  </div>
                </div>

                {(selectedTemplate.mappings || []).length > 0 && (
                  <div className="divide-y divide-gray-100 max-h-32 overflow-y-auto">
                    {selectedTemplate.mappings.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 px-3 py-1.5 text-[11px]"
                      >
                        <span className="text-gray-600 truncate">
                          {m.component_name || "—"}
                        </span>
                        <span className="font-medium text-gray-900">
                          {describeMapping(m)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Effective dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="pay-from"
                className="block text-[11px] text-gray-700 mb-1.5"
              >
                Effective from
              </label>
              <div className="relative">
                <Icon
                  icon="solar:calendar-outline"
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  id="pay-from"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  onClick={openPicker}
                  className={dateInputCls}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="pay-to"
                className="block text-[11px] text-gray-700 mb-1.5"
              >
                Effective to (optional)
              </label>
              <div className="relative">
                <Icon
                  icon="solar:calendar-outline"
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  id="pay-to"
                  type="date"
                  value={effectiveTo}
                  min={effectiveFrom || undefined}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  onClick={openPicker}
                  className={dateInputCls}
                />
              </div>
            </div>
          </div>

          {/* Mode toggle: only shown with the privilege */}
          {canSelectMultiple && (
            <div className="inline-flex self-start p-0.5 rounded-lg bg-[#F4F6F8] border border-gray-200">
              {[
                ["single", "Individual"],
                ["multiple", "Bulk"],
              ].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => switchMode(val)}
                  className={`px-3 py-1 text-[11px] rounded-md transition-colors ${
                    mode === val
                      ? "bg-black text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Staff search */}
          <div className="relative">
            <Icon
              icon="mdi:magnify"
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID, department..."
              aria-label="Search staff"
              className={`${inputCls} pl-9`}
            />
          </div>

          <div className="flex items-center justify-between">
            {isMultiple ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAllFiltered}
                  disabled={filtered.length === 0}
                  className="accent-black w-4 h-4 rounded border-gray-200 cursor-pointer"
                />
                <span className="text-[11px] text-gray-700">
                  {query.trim() ? "Select all results" : "Select all staff"}
                </span>
              </label>
            ) : (
              <span className="text-[11px] text-gray-700">
                Select an employee
              </span>
            )}
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span>{selected.length} selected</span>
              {isMultiple && selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="underline hover:text-red-500"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Staff list */}
          <div className="border border-gray-200 rounded-xl overflow-hidden min-h-0">
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
              {staff.loading && (
                <div className="p-3 space-y-2" role="status">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-9 rounded bg-gray-100 animate-pulse"
                    />
                  ))}
                  <span className="sr-only">Loading staff</span>
                </div>
              )}

              {!staff.loading && staff.error && (
                <div
                  className="p-4 flex items-center justify-between gap-3"
                  role="alert"
                >
                  <p className="text-[11px] text-red-600">{staff.error}</p>
                  <button
                    type="button"
                    onClick={() => setStaffReload((k) => k + 1)}
                    className="px-3 py-1.5 text-[11px] border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!staff.loading && !staff.error && filtered.length === 0 && (
                <p className="p-4 text-[11px] text-gray-500">
                  {staff.users.length === 0
                    ? "No staff found."
                    : "No staff match your search."}
                </p>
              )}

              {!staff.loading &&
                !staff.error &&
                filtered.map((u) => {
                  const id = String(u.uuid);
                  const checked = selectedSet.has(id);
                  return (
                    <label
                      key={id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                        checked ? "bg-[#F4F6F8]" : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type={isMultiple ? "checkbox" : "radio"}
                        name="payroll-staff"
                        checked={checked}
                        onChange={() => toggle(id)}
                        className="accent-black w-4 h-4 border-gray-200 cursor-pointer shrink-0"
                      />
                      <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium flex items-center justify-center shrink-0">
                        {initials(u.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] text-gray-900 truncate">
                          {u.name}
                        </span>
                        <span className="block text-[10px] text-gray-500 truncate">
                          {[u.designation, u.department]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        #{id}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>

          {error && (
            <p className="text-[11px] text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-2 border border-gray-300 rounded-xl text-[12px] hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              submitting ||
              !templateId ||
              !effectiveFrom ||
              selected.length === 0
            }
            className="px-6 py-2 bg-black text-white rounded-xl text-[12px] hover:bg-zinc-800 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Allocating..."
              : isMultiple && selected.length > 0
                ? `Allocate (${selected.length})`
                : "Allocate"}
          </button>
        </div>
      </form>
    </div>
  );
}
