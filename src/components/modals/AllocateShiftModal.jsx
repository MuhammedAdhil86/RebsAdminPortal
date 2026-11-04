import React, { useEffect, useMemo, useState } from "react";
import { Clock, Search, X } from "lucide-react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import {
  allocateShift,
  fetchShifts,
  getMappedPolicies,
  getStaffList,
  isCanceled,
} from "../../services/PolicyService"; // adjust path

// The company's default shift (falls back to the first one)
const pickDefaultShift = (shifts = []) =>
  shifts.find((s) => s.is_default) ?? shifts[0] ?? null;

// One allocate-shift request covers one or many staff.
//  bulk = false -> payload uses staff_id  (single)
//  bulk = true  -> payload uses staff_ids (bulk)
// Resolves to { succeeded: [ids], failed: [{ id, error }] }.
const allocateShiftToMany = async ({
  companyId,
  shiftId,
  staffIds,
  fromDate,
  toDate,
  policyIds,
  bulk,
}) => {
  const ids = [
    ...new Set((staffIds || []).map((id) => String(id).trim())),
  ].filter(Boolean);

  try {
    await allocateShift(
      { companyId, shiftId, staffIds: ids, fromDate, toDate, policyIds, bulk },
      { silent: true },
    );
    return { succeeded: ids, failed: [] };
  } catch (err) {
    if (isCanceled(err)) throw err;
    const error = err?.message || "Failed";
    return { succeeded: [], failed: ids.map((id) => ({ id, error })) };
  }
};

const globalFont = "font-['Poppins'] font-normal text-[12px]";

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

/**
 * Allocate a shift (and its mapped policies) to one or more staff for a
 * date range.
 *
 * Props:
 *  - open               boolean
 *  - onClose            () => void
 *  - onSuccess          ({ staffIds, shiftId, fromDate, toDate, policyIds }) => void
 *  - companyId          number | string   (sent as platform_id)
 *  - shiftId            optional. When given, that shift is used (no dropdown).
 *                       When omitted, a "Shift" dropdown is loaded from
 *                       fetchShifts(companyId) and the default shift is preselected.
 *  - shiftName          optional display name (used with shiftId)
 *  - staffId            optional. Hard-locks the modal to ONE staff member:
 *                       the staff list is hidden and only they are allocated.
 *  - staffName          optional display name (used with staffId)
 *  - defaultStaffId     optional. Staff pre-ticked in the list (can be changed).
 *  - canSelectMultiple  privilege flag (default true). true -> Single / Multiple
 *                       toggle is shown. false -> single staff only (radio list).
 */
export default function AllocateShiftModal({
  open,
  onClose,
  onSuccess,
  companyId,
  shiftId: shiftIdProp,
  shiftName,
  staffId: staffIdProp,
  staffName,
  defaultStaffId,
  canSelectMultiple = true,
}) {
  const singleStaff = staffIdProp != null && staffIdProp !== "";

  // "single" | "multiple"
  const [mode, setMode] = useState("single");
  const isMultiple = canSelectMultiple && mode === "multiple";

  const [staff, setStaff] = useState({
    loading: false,
    error: null,
    users: [],
  });
  const [staffReload, setStaffReload] = useState(0);

  const [shifts, setShifts] = useState({
    loading: false,
    error: null,
    list: [],
  });
  const [shiftReload, setShiftReload] = useState(0);
  const [shiftId, setShiftId] = useState("");

  const [policies, setPolicies] = useState({
    loading: false,
    error: null,
    list: [],
  });
  const [policyReload, setPolicyReload] = useState(0);
  const [selectedPolicies, setSelectedPolicies] = useState([]); // id strings

  const [fromDate, setFromDate] = useState(todayStr());
  const [toDate, setToDate] = useState("");

  const [selected, setSelected] = useState([]); // uuid strings
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reset every time the modal opens
  useEffect(() => {
    if (!open) return;
    setMode("single");
    setSelected(
      singleStaff
        ? [String(staffIdProp)]
        : defaultStaffId
          ? [String(defaultStaffId)]
          : [],
    );
    setQuery("");
    setError(null);
    setSubmitting(false);
    setFromDate(todayStr());
    setToDate("");
    setShiftId(shiftIdProp != null ? String(shiftIdProp) : "");
  }, [open, shiftIdProp, staffIdProp, defaultStaffId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load staff when opened (not needed when allocating to one given staff)
  useEffect(() => {
    if (!open || companyId == null || singleStaff) return undefined;
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
        console.error("[AllocateShiftModal] staff load failed", err);
        setStaff({
          loading: false,
          error: errorMessage(err, "Failed to load staff."),
          users: [],
        });
      }
    })();

    return () => controller.abort();
  }, [open, companyId, staffReload, singleStaff]);

  // Load shifts when opened (needed for the dropdown and the default dates)
  useEffect(() => {
    if (!open || companyId == null) return undefined;
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      setShifts((s) => ({ ...s, loading: true, error: null }));
      try {
        const { shifts: list } = await fetchShifts(companyId, {
          signal,
          silent: true,
        });
        setShifts({ loading: false, error: null, list });
        // Preselect the default shift when none was passed in
        if (shiftIdProp == null) {
          const def = pickDefaultShift(list);
          if (def) setShiftId((cur) => cur || String(def.id));
        }
      } catch (err) {
        if (signal.aborted || isCanceled(err)) return;
        console.error("[AllocateShiftModal] shifts load failed", err);
        setShifts({
          loading: false,
          error: errorMessage(err, "Failed to load shifts."),
          list: [],
        });
      }
    })();

    return () => controller.abort();
  }, [open, companyId, shiftIdProp, shiftReload]);

  // Load the policies mapped to the chosen shift
  useEffect(() => {
    if (!open || companyId == null || !shiftId) {
      setPolicies({ loading: false, error: null, list: [] });
      setSelectedPolicies([]);
      return undefined;
    }
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      setPolicies((p) => ({ ...p, loading: true, error: null }));
      try {
        const { policies: list } = await getMappedPolicies(companyId, shiftId, {
          signal,
          silent: true,
        });
        setPolicies({ loading: false, error: null, list });
        setSelectedPolicies(list.map((p) => String(p.id))); // preselect all
      } catch (err) {
        if (signal.aborted || isCanceled(err)) return;
        console.error("[AllocateShiftModal] policies load failed", err);
        setPolicies({
          loading: false,
          error: errorMessage(err, "Failed to load policies."),
          list: [],
        });
        setSelectedPolicies([]);
      }
    })();

    return () => controller.abort();
  }, [open, companyId, shiftId, policyReload]);

  const selectedShift = useMemo(
    () => shifts.list.find((s) => String(s.id) === String(shiftId)) || null,
    [shifts.list, shiftId],
  );

  // When the shift changes (or the modal reopens), default the end date to
  // the shift's policy end date. Runs after the reset effect above, so it wins.
  useEffect(() => {
    if (!open) return;
    const end = selectedShift?.policies?.[0]?.end_date;
    setToDate(end ? String(end).slice(0, 10) : "");
  }, [open, selectedShift?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const togglePolicy = (id) =>
    setSelectedPolicies((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!shiftId) return setError("Please choose a shift.");
    if (!fromDate || !toDate) return setError("Choose a start and end date.");
    if (toDate < fromDate)
      return setError("End date cannot be before start date.");
    if (selectedPolicies.length === 0)
      return setError("Select at least one policy.");
    if (selected.length === 0)
      return setError("Select at least one staff member.");

    setSubmitting(true);
    setError(null);
    try {
      const { succeeded, failed } = await allocateShiftToMany({
        companyId,
        shiftId,
        staffIds: selected,
        fromDate,
        toDate,
        policyIds: selectedPolicies,
        bulk: isMultiple,
      });

      if (failed.length === 0) {
        toast.success(
          `Shift allocated to ${succeeded.length} staff member${
            succeeded.length > 1 ? "s" : ""
          }`,
        );
        onSuccess?.({
          staffIds: succeeded,
          shiftId,
          fromDate,
          toDate,
          policyIds: selectedPolicies,
        });
        onClose();
        return;
      }

      // Partial or total failure: keep the modal open with the failed staff
      if (succeeded.length > 0) {
        toast.warn(
          `Allocated ${succeeded.length}, failed ${failed.length}. Retry the rest.`,
        );
        onSuccess?.({
          staffIds: succeeded,
          shiftId,
          fromDate,
          toDate,
          policyIds: selectedPolicies,
        });
      }
      setSelected(failed.map((f) => f.id));
      setError(
        `${failed.length} failed: ${failed[0].error}${
          failed.length > 1 ? " (and others)" : ""
        }`,
      );
      setSubmitting(false);
    } catch (err) {
      if (isCanceled(err)) return;
      console.error("[AllocateShiftModal] allocate failed", err);
      setError(errorMessage(err, "Failed to allocate shift."));
      setSubmitting(false);
    }
  };

  const subtitle = singleStaff
    ? staffName || `Staff #${staffIdProp}`
    : shiftName ||
      selectedShift?.shift_name ||
      "Assign a shift to staff for a date range";

  const inputCls =
    "w-full px-4 py-2 bg-[#F4F6F8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all";

  // Date inputs: hide the browser's own calendar icon (we draw ours on the
  // left) and open the picker when the field is clicked instead.
  const dateInputCls = `${inputCls} pl-9 [&::-webkit-calendar-picker-indicator]:hidden`;
  const openPicker = (e) => {
    try {
      e.currentTarget.showPicker?.();
    } catch {
      /* some browsers only allow showPicker from a user gesture; ignore */
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${globalFont}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="allocate-shift-title"
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
              <Clock size={16} />
            </span>
            <div className="min-w-0">
              <h2
                id="allocate-shift-title"
                className="text-[14px] font-semibold text-gray-900 leading-tight"
              >
                Allocate shift
              </h2>
              <p className="text-[11px] text-gray-500 truncate">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-3 flex flex-col gap-3 min-h-0 overflow-y-auto">
          {/* Shift (only when not passed in as a prop) */}
          {shiftIdProp == null && (
            <div>
              <label
                htmlFor="alloc-shift"
                className="block text-[11px] text-gray-700 mb-1.5"
              >
                Shift
              </label>
              {shifts.error ? (
                <p className="text-[11px] text-red-600" role="alert">
                  {shifts.error}{" "}
                  <button
                    type="button"
                    onClick={() => setShiftReload((k) => k + 1)}
                    className="underline hover:text-red-800"
                  >
                    Retry
                  </button>
                </p>
              ) : (
                <select
                  id="alloc-shift"
                  value={shiftId}
                  onChange={(e) => setShiftId(e.target.value)}
                  disabled={shifts.loading}
                  className={inputCls}
                >
                  <option value="">
                    {shifts.loading ? "Loading shifts..." : "Select a shift"}
                  </option>
                  {shifts.list.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.shift_name}
                      {s.shift_code ? ` (${s.shift_code})` : ""}
                      {s.is_default ? " · default" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="alloc-from"
                className="block text-[11px] text-gray-700 mb-1.5"
              >
                From date
              </label>
              <div className="relative">
                <Icon
                  icon="solar:calendar-outline"
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  id="alloc-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  onClick={openPicker}
                  className={dateInputCls}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="alloc-to"
                className="block text-[11px] text-gray-700 mb-1.5"
              >
                To date
              </label>
              <div className="relative">
                <Icon
                  icon="solar:calendar-outline"
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  id="alloc-to"
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                  onClick={openPicker}
                  className={dateInputCls}
                />
              </div>
            </div>
          </div>

          {/* Mapped policies */}
          {shiftId && (
            <div>
              <span className="block text-[11px] text-gray-700 mb-1.5">
                Policies
              </span>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {policies.loading && (
                  <div className="p-3" role="status">
                    <div className="h-9 rounded bg-gray-100 animate-pulse" />
                    <span className="sr-only">Loading policies</span>
                  </div>
                )}

                {!policies.loading && policies.error && (
                  <div
                    className="p-3 flex items-center justify-between gap-3"
                    role="alert"
                  >
                    <p className="text-[11px] text-red-600">{policies.error}</p>
                    <button
                      type="button"
                      onClick={() => setPolicyReload((k) => k + 1)}
                      className="px-3 py-1.5 text-[11px] border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!policies.loading &&
                  !policies.error &&
                  policies.list.length === 0 && (
                    <p className="p-3 text-[11px] text-gray-500">
                      No policies are mapped to this shift.
                    </p>
                  )}

                {!policies.loading && !policies.error && (
                  <div className="divide-y divide-gray-100">
                    {policies.list.map((p) => {
                      const id = String(p.id);
                      const checked = selectedPolicies.includes(id);
                      return (
                        <label
                          key={id}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                            checked
                              ? "bg-[#F4F6F8]"
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePolicy(id)}
                            className="accent-black w-4 h-4 rounded border-gray-200 cursor-pointer shrink-0"
                          />
                          <span className="min-w-0 flex-1 text-[12px] text-gray-900 truncate">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {p.code}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hard-locked single staff (staffId prop) */}
          {singleStaff && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 bg-[#F4F6F8]">
              <span className="w-8 h-8 rounded-full bg-white text-gray-600 text-[10px] font-medium flex items-center justify-center shrink-0">
                {initials(staffName || String(staffIdProp))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] text-gray-900 truncate">
                  {staffName || `Staff #${staffIdProp}`}
                </span>
                <span className="block text-[10px] text-gray-500">
                  Staff ID #{staffIdProp}
                </span>
              </span>
            </div>
          )}

          {/* Staff chooser: all staff, single or multiple */}
          {!singleStaff && (
            <>
              {/* Mode toggle: only shown with the privilege */}
              {canSelectMultiple && (
                <div className="inline-flex self-start p-0.5 rounded-lg bg-[#F4F6F8] border border-gray-200">
                  {[
                    ["single", "Single"],
                    ["multiple", "Multiple"],
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
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
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
                    Select one staff member
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
                            checked
                              ? "bg-[#F4F6F8]"
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type={isMultiple ? "checkbox" : "radio"}
                            name="alloc-staff"
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
            </>
          )}

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
              !shiftId ||
              !fromDate ||
              !toDate ||
              selectedPolicies.length === 0 ||
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
