import React, { useEffect, useMemo, useState } from "react";
import { Search, Users, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  allocateStaffsToLeavePolicy,
  getLeavePolicies,
  getStaffList,
  isCanceled,
} from "../../services/PolicyService"; // adjust path

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

/**
 * Allocate staff to an existing leave policy.
 *
 * Props:
 *  - open           boolean
 *  - onClose        () => void
 *  - onSuccess      (staffIds: string[]) => void   (after a successful POST)
 *  - companyId      number | string   (sent as platform_id)
 *  - leavePolicyId  optional. When given, that policy is used (no dropdown).
 *                   When omitted, the modal shows a "Leave policy" dropdown
 *                   loaded from getLeavePolicies(companyId).
 *  - policyName     optional display name (used with leavePolicyId)
 */
export default function AllocateLeavePolicyModal({
  open,
  onClose,
  onSuccess,
  companyId,
  leavePolicyId,
  policyName,
}) {
  const [staff, setStaff] = useState({
    loading: false,
    error: null,
    users: [],
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState([]); // array of uuid strings
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [policies, setPolicies] = useState({
    loading: false,
    error: null,
    list: [],
  });
  const [policyReload, setPolicyReload] = useState(0);
  const [policyId, setPolicyId] = useState("");

  // Reset every time the modal opens
  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setQuery("");
    setError(null);
    setSubmitting(false);
    setPolicyId(leavePolicyId != null ? String(leavePolicyId) : "");
  }, [open, leavePolicyId]);

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
        console.error("[AllocateLeavePolicyModal] staff load failed", err);
        setStaff({
          loading: false,
          error: errorMessage(err, "Failed to load staff."),
          users: [],
        });
      }
    })();

    return () => controller.abort();
  }, [open, companyId, reloadKey]);

  // Load leave policies for the dropdown (only when no policy was passed in)
  useEffect(() => {
    if (!open || companyId == null || leavePolicyId != null) return undefined;
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      setPolicies((s) => ({ ...s, loading: true, error: null }));
      try {
        const body = await getLeavePolicies(companyId, {
          signal,
          silent: true,
        });
        const raw = Array.isArray(body?.policies)
          ? body.policies
          : Array.isArray(body?.data)
            ? body.data
            : [];
        // Accept { id, name, code } or { policy_id, policy_name, policy_code }
        const list = raw
          .map((p) => ({
            id: p.id ?? p.policy_id,
            name: p.name ?? p.policy_name ?? `Policy ${p.id ?? p.policy_id}`,
            code: p.code ?? p.policy_code,
          }))
          .filter((p) => p.id != null);
        setPolicies({ loading: false, error: null, list });
      } catch (err) {
        if (signal.aborted || isCanceled(err)) return;
        console.error("[AllocateLeavePolicyModal] policies load failed", err);
        setPolicies({
          loading: false,
          error: errorMessage(err, "Failed to load leave policies."),
          list: [],
        });
      }
    })();

    return () => controller.abort();
  }, [open, companyId, leavePolicyId, policyReload]);

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

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const ids = filtered.map((u) => String(u.uuid));
      if (allFilteredSelected) return prev.filter((id) => !ids.includes(id));
      return [...new Set([...prev, ...ids])];
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!policyId) {
      setError("Please choose a leave policy.");
      return;
    }
    if (selected.length === 0) {
      setError("Select at least one staff member.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await allocateStaffsToLeavePolicy(
        { companyId, leavePolicyId: policyId, staffIds: selected },
        { silent: true }, // the modal shows its own message
      );
      toast.success(
        `Leave policy allocated to ${selected.length} staff member${
          selected.length > 1 ? "s" : ""
        }`,
      );
      onSuccess?.(selected);
      onClose();
    } catch (err) {
      if (isCanceled(err)) return;
      console.error("[AllocateLeavePolicyModal] allocate failed", err);
      setError(errorMessage(err, "Failed to allocate leave policy."));
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${globalFont}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="allocate-leave-title"
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
              <Users size={16} />
            </span>
            <div className="min-w-0">
              <h2
                id="allocate-leave-title"
                className="text-[14px] font-semibold text-gray-900 leading-tight"
              >
                Allocate staff
              </h2>
              <p className="text-[11px] text-gray-500 truncate">
                {policyName ||
                  policies.list.find((p) => String(p.id) === String(policyId))
                    ?.name ||
                  "Assign a leave policy to staff"}
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
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-3 flex flex-col gap-3 min-h-0">
          {/* Leave policy (only when not passed in as a prop) */}
          {leavePolicyId == null && (
            <div>
              <label
                htmlFor="alloc-leave-policy"
                className="block text-[11px] text-gray-700 mb-1.5"
              >
                Leave policy
              </label>
              {!policies.loading && policies.list.length === 0 ? (
                <>
                  <input
                    id="alloc-leave-policy"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    placeholder="Enter leave policy ID"
                    value={policyId}
                    onChange={(e) => setPolicyId(e.target.value)}
                    className="w-full px-4 py-2 bg-[#F4F6F8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all"
                  />
                  <p className="mt-1 text-[10px] text-gray-500">
                    {policies.error
                      ? `${policies.error} Enter the policy ID manually, or `
                      : "No leave policies found. Enter the policy ID manually, or "}
                    <button
                      type="button"
                      onClick={() => setPolicyReload((k) => k + 1)}
                      className="underline hover:text-gray-800"
                    >
                      retry
                    </button>
                    .
                  </p>
                </>
              ) : (
                <select
                  id="alloc-leave-policy"
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  disabled={policies.loading}
                  className="w-full px-4 py-2 bg-[#F4F6F8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all"
                >
                  <option value="">
                    {policies.loading
                      ? "Loading leave policies..."
                      : "Select a leave policy"}
                  </option>
                  {policies.list.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                      {p.code ? ` (${p.code})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

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
              className="w-full pl-9 pr-4 py-2 bg-[#F4F6F8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all"
            />
          </div>

          <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span>{selected.length} selected</span>
              {selected.length > 0 && (
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

          <div className="border border-gray-200 rounded-xl overflow-hidden min-h-0">
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
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
                    onClick={() => setReloadKey((k) => k + 1)}
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
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(id)}
                        className="accent-black w-4 h-4 rounded border-gray-200 cursor-pointer shrink-0"
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
            disabled={submitting || !policyId || selected.length === 0}
            className="px-6 py-2 bg-black text-white rounded-xl text-[12px] hover:bg-zinc-800 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Allocating..."
              : selected.length > 0
                ? `Allocate (${selected.length})`
                : "Allocate"}
          </button>
        </div>
      </form>
    </div>
  );
}
