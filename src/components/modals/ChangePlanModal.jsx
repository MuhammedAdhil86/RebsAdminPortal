import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import {
  getPlanOptions,
  changeSubscriptionPlan,
} from "../../services/SubscriptionService";
import { getBillingPeriods } from "../../services/MasterService";
import ConfirmModal from "../modals/ConfirmModal";

/* Place this file in src/components/subscriptions/ChangePlanModal.jsx
   Flow: 1) billing period  ->  2) plans + services  ->  3) confirm
   POST /tenant/subscription/{id}/change-plan */

const SILENT = { silent: true };

const toList = (res) =>
  Array.isArray(res) ? res : res?.data || res?.results || [];

const errMsg = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

function ChangePlanModal({ row, onClose, onChanged }) {
  const [periods, setPeriods] = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  // start on the subscription's current billing period (can be changed)
  const [billingPeriodId, setBillingPeriodId] = useState(
    row.billingPeriodId != null ? String(row.billingPeriodId) : "",
  );

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planId, setPlanId] = useState(null);
  const [serviceIds, setServiceIds] = useState([]);

  const [carryOver, setCarryOver] = useState(true); // default true
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  /* 1) billing periods */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingPeriods(true);
        const res = await getBillingPeriods(SILENT);
        if (active) setPeriods(toList(res));
      } catch (err) {
        toast.error(errMsg(err, "Failed to load billing periods."));
      } finally {
        if (active) setLoadingPeriods(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  /* 2) plans for the chosen billing period */
  useEffect(() => {
    setPlans([]);
    setPlanId(null);
    setServiceIds([]);
    if (billingPeriodId === "") return;

    let active = true;
    (async () => {
      try {
        setLoadingPlans(true);
        const res = await getPlanOptions(Number(billingPeriodId), SILENT);
        if (active) setPlans(toList(res));
      } catch (err) {
        toast.error(errMsg(err, "Failed to load plans."));
      } finally {
        if (active) setLoadingPlans(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [billingPeriodId]);

  const selectedPlan = plans.find((p) => p.id === planId);

  const choosePlan = (plan) => {
    setPlanId(plan.id);
    setServiceIds((plan.services || []).map((s) => s.id)); // all selected by default
  };

  const toggleService = (id) =>
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleChangeClick = () => {
    if (!row.subscriptionId) {
      toast.error("Subscription id not found.");
      return;
    }
    if (billingPeriodId === "") {
      toast.error("Select a billing period.");
      return;
    }
    if (!selectedPlan) {
      toast.error("Select a plan.");
      return;
    }
    if (serviceIds.length === 0) {
      toast.error("Select at least one service.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      setSaving(true);
      await changeSubscriptionPlan(
        row.subscriptionId,
        {
          new_plan_id: selectedPlan.id,
          billing_period_id: Number(billingPeriodId),
          service_ids: serviceIds,
          carry_over_user_extensions: carryOver,
        },
        SILENT,
      );
      toast.success(`Plan changed to ${selectedPlan.name}.`);
      setConfirmOpen(false);
      onChanged();
    } catch (err) {
      toast.error(errMsg(err, "Failed to change plan."));
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-black";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40"
      onClick={() => !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-lg p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-gray-900">Change Plan</p>
          <p className="text-[11px] text-gray-500">
            Current plan: {row.planName || "—"}
            {row.billingPeriod ? ` · ${row.billingPeriod}` : ""}
          </p>
        </div>

        {/* step 1: billing period */}
        <div className="flex flex-col gap-1.5 max-w-xs">
          <label className="text-[11px] uppercase tracking-wider text-gray-500">
            1. Billing Period
          </label>
          <select
            value={billingPeriodId}
            onChange={(e) => setBillingPeriodId(e.target.value)}
            disabled={loadingPeriods}
            className={inputCls}
          >
            <option value="">
              {loadingPeriods ? "Loading..." : "Select billing period"}
            </option>
            {periods.map((bp) => (
              <option key={bp.id} value={bp.id}>
                {bp.name}
                {bp.months ? ` (${bp.months} mo)` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* step 2: plans + services */}
        {billingPeriodId !== "" && (
          <div className="flex flex-col gap-2">
            <label className="text-[11px] uppercase tracking-wider text-gray-500">
              2. Choose Plan
            </label>

            {loadingPlans ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                <Icon icon="line-md:loading-loop" className="w-4 h-4" />
                Loading plans...
              </div>
            ) : plans.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">
                No plans available for this billing period.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {plans.map((plan) => {
                  const active = plan.id === planId;
                  const isCurrent = plan.name === row.planName;
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-xl border p-4 transition-colors ${
                        active
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => choosePlan(plan)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <span className="flex items-center gap-2">
                          <Icon
                            icon={
                              active
                                ? "mdi:radiobox-marked"
                                : "mdi:radiobox-blank"
                            }
                            className="w-5 h-5"
                          />
                          <span className="text-gray-900">{plan.name}</span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-600">
                              Current
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {(plan.services || []).length} services
                        </span>
                      </button>

                      {/* services of the plan */}
                      {active ? (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col gap-2">
                          <p className="text-[11px] text-gray-500">
                            Services to include
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(plan.services || []).map((s) => {
                              const checked = serviceIds.includes(s.id);
                              return (
                                <label
                                  key={s.id}
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                                    checked
                                      ? "border-black bg-white text-gray-900"
                                      : "border-gray-200 text-gray-500"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleService(s.id)}
                                    className="w-3.5 h-3.5 accent-black"
                                  />
                                  {s.name}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(plan.services || []).map((s) => (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 rounded-md bg-gray-100 text-[11px] text-gray-700"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* carry over user extensions */}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={carryOver}
            onChange={(e) => setCarryOver(e.target.checked)}
            className="w-4 h-4 accent-black"
          />
          Carry over existing user extensions
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleChangeClick}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon icon="mdi:swap-horizontal" className="w-4 h-4" />
            Change Plan
          </button>
        </div>

        <ConfirmModal
          open={confirmOpen}
          title="Change plan?"
          message={`Are you sure you want to change ${row.name}'s plan to ${selectedPlan?.name || ""}?`}
          confirmText="Change Plan"
          loading={saving}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    </div>
  );
}

export default ChangePlanModal;
