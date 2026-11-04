import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { isCanceled } from "../../services/PolicyService"; // adjust path if needed
import { getSalaryTemplates } from "../../services/PayrollService"; // adjust path if needed
import AllocatePayrollModal from "../modals/AllocatePayrollModal"; // adjust path if needed

const errorMessage = (err, fallback) =>
  err?.data?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;

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

function TemplateCard({ template, onAllocate }) {
  const [open, setOpen] = useState(false);
  const mappings = Array.isArray(template.mappings) ? template.mappings : [];
  const isActive = String(template.status).toLowerCase() === "active";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
            <Icon icon="mdi:file-document-outline" className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 leading-tight truncate">
              {template.name}
            </h3>
            <p className="text-[11px] text-gray-500 truncate">
              {template.description || "No description"}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
            isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {template.status || "—"}
        </span>
      </div>

      <div className="px-4 pb-3">
        <p className="text-[10px] uppercase tracking-wide text-gray-400">
          Annual CTC
        </p>
        <p className="text-base font-semibold text-gray-900">
          {formatINR(template.annual_ctc)}
        </p>
      </div>

      {open && mappings.length > 0 && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {mappings.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 px-4 py-2 text-[11px]"
            >
              <span className="text-gray-600">Component #{m.component_id}</span>
              <span className="font-medium text-gray-900">
                {describeMapping(m)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={mappings.length === 0}
          className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon
            icon="mdi:chevron-down"
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
          {mappings.length} component{mappings.length === 1 ? "" : "s"}
        </button>

        <button
          type="button"
          onClick={() => onAllocate(template)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-black text-white hover:bg-gray-800 shadow-sm transition-colors"
        >
          <Icon icon="mdi:account-cash-outline" className="w-4 h-4" />
          Allocate
        </button>
      </div>
    </div>
  );
}

function TemplatesSkeleton() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
      role="status"
      aria-live="polite"
    >
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-40 rounded-2xl border border-gray-200 bg-white p-4"
        >
          <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
          <div className="mt-3 h-3 w-48 rounded bg-gray-100 animate-pulse" />
          <div className="mt-6 h-6 w-24 rounded bg-gray-100 animate-pulse" />
        </div>
      ))}
      <span className="sr-only">Loading salary templates</span>
    </div>
  );
}

export default function PayrollTab({
  companyId,
  companyName,
  canBulkAllocate = true, // multiple select enabled; pass false to restrict
}) {
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const [tpl, setTpl] = useState({
    loading: true,
    error: null,
    items: [],
  });

  const [allocateOpen, setAllocateOpen] = useState(false);
  const [pickedTemplateId, setPickedTemplateId] = useState(null);

  // Load salary templates
  useEffect(() => {
    if (companyId == null) return undefined;
    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      setTpl((s) => ({ ...s, loading: true, error: null }));
      try {
        const { templates } = await getSalaryTemplates(companyId, { signal });
        setTpl({ loading: false, error: null, items: templates });
      } catch (err) {
        if (signal.aborted || isCanceled(err)) return;
        console.error("[PayrollTab] templates load failed", err);
        setTpl({
          loading: false,
          error: errorMessage(err, "Failed to load salary templates."),
          items: [],
        });
      }
    };

    load();
    return () => controller.abort();
  }, [companyId, reloadKey]);

  const openAllocate = (template = null) => {
    setPickedTemplateId(template ? template.id : null);
    setAllocateOpen(true);
  };

  return (
    <div className="flex flex-col gap-3 font-[Poppins]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-gray-500">
          Salary templates for {companyName || "this company"}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openAllocate(null)}
            disabled={tpl.loading || tpl.items.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-black text-white hover:bg-gray-800 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="mdi:account-cash-outline" className="w-4 h-4" />
            Allocate salary
          </button>

          <button
            type="button"
            onClick={reload}
            title="Refresh"
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 transition-colors shadow-sm"
          >
            <Icon
              icon="mdi:refresh"
              className={`w-4 h-4 ${tpl.loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {tpl.loading && <TemplatesSkeleton />}

      {!tpl.loading && tpl.error && (
        <div className="flex items-center justify-between gap-3" role="alert">
          <p className="text-xs text-red-600">{tpl.error}</p>
          <button
            type="button"
            onClick={reload}
            className="px-3 py-1.5 text-xs border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 shadow-sm"
          >
            Retry
          </button>
        </div>
      )}

      {!tpl.loading && !tpl.error && tpl.items.length === 0 && (
        <p className="text-xs text-gray-500">
          No salary templates found for this company.
        </p>
      )}

      {!tpl.loading && !tpl.error && tpl.items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {tpl.items.map((t) => (
            <TemplateCard key={t.id} template={t} onAllocate={openAllocate} />
          ))}
        </div>
      )}

      <AllocatePayrollModal
        open={allocateOpen}
        onClose={() => setAllocateOpen(false)}
        companyId={companyId}
        templates={tpl.items}
        templatesLoading={tpl.loading}
        templateId={pickedTemplateId}
        canSelectMultiple={canBulkAllocate}
        onSuccess={reload}
      />
    </div>
  );
}
