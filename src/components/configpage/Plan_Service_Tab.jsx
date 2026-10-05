import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import {
  getSubscriptionPlans,
  getServices,
} from "../../services/MasterService";

const SILENT = { silent: true };

// Clean date formatter
const formatDate = (isoString) => {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

export default function PlanServiceTab({ api, requestDelete }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dropdown master lists
  const [plans, setPlans] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    plan_id: "",
    service_id: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Fetch current list
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.list();
      setItems(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error("Failed to load plan services:", err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // 2. Fetch dropdown options
  const loadSelectOptions = useCallback(async () => {
    try {
      setLoadingLookups(true);
      const [plansRes, servicesRes] = await Promise.all([
        getSubscriptionPlans(SILENT),
        getServices(SILENT),
      ]);
      setPlans(Array.isArray(plansRes) ? plansRes : plansRes?.data || []);
      setServices(
        Array.isArray(servicesRes) ? servicesRes : servicesRes?.data || [],
      );
    } catch (err) {
      console.error("Failed to load lookup options:", err);
    } finally {
      setLoadingLookups(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    loadSelectOptions();
  }, [fetchData, loadSelectOptions]);

  // Prevent duplicate mappings
  const existingServiceIdsForPlan = useMemo(() => {
    if (!formData.plan_id) return new Set();
    const currentPlanId = Number(formData.plan_id);

    return new Set(
      items
        .filter(
          (item) =>
            Number(item.plan?.id || item.plan_id) === currentPlanId &&
            (formData.id === 0 || item.id !== formData.id),
        )
        .map((item) => Number(item.service?.id || item.service_id)),
    );
  }, [formData.plan_id, formData.id, items]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setSubmitError("");
    setFormData({
      id: 0,
      plan_id: plans[0]?.id || "",
      service_id: "",
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setSubmitError("");
    setFormData({
      id: item.id,
      plan_id: item.plan?.id || item.plan_id || "",
      service_id: item.service?.id || item.service_id || "",
    });
    setIsModalOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!formData.plan_id) {
      setSubmitError("Please select a subscription plan.");
      return;
    }
    if (!formData.service_id) {
      setSubmitError("Please select a service.");
      return;
    }

    try {
      const payload = {
        id: Number(formData.id || 0),
        plan_id: Number(formData.plan_id),
        service_id: Number(formData.service_id),
      };

      if (formData.id > 0) {
        await api.update(payload);
      } else {
        await api.create(payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Save failed:", err);
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save plan service mapping.",
      );
    }
  };

  // Delete: DeleteConfirmModal needs { singular, name, onConfirm }.
  // onConfirm must return true (close modal) or false (keep it open).
  const handleDelete = async (item) => {
    try {
      await api.remove(item.id);
      setItems((prev) => prev.filter((current) => current.id !== item.id));
      toast.success("Plan Service deleted.");
      return true;
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete plan service.",
      );
      return false;
    }
  };

  const askDelete = (item, planName, serviceName) => {
    if (typeof requestDelete !== "function") {
      console.error('requestDelete missing for section "planService"');
      toast.error('Delete modal not connected for "Plan Services".');
      return;
    }

    requestDelete({
      singular: "Plan Service",
      name: `${planName} → ${serviceName}`,
      onConfirm: () => handleDelete(item),
    });
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Plan Services</h3>
          <p className="text-xs text-gray-500">
            View and manage mapped services for each subscription plan
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-black text-white hover:bg-gray-800 transition"
        >
          <Icon icon="mdi:plus" className="w-4 h-4" />
          Add Plan Service
        </button>
      </div>

      {/* Structured Table: Plan Name -> Service Name -> Code -> Created Date -> Actions */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 font-medium">
              <th className="py-3 px-3">Plan Name</th>
              <th className="py-3 px-3">Service Name</th>
              <th className="py-3 px-3">Code</th>
              <th className="py-3 px-3">Created Date</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <Icon icon="line-md:loading-loop" className="w-4 h-4" />
                    <span>Loading plan services...</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-400">
                  No plan service mappings found.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const planName =
                  item.plan?.name || `Plan #${item.plan?.id || item.plan_id}`;
                const serviceName =
                  item.service?.name ||
                  `Service #${item.service?.id || item.service_id}`;
                const planCode = item.plan?.code || "—";
                const dateCreated = formatDate(item.created_at);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    {/* 1. Plan Name */}
                    <td className="py-3 px-3 font-semibold text-gray-900">
                      {planName}
                    </td>

                    {/* 2. Service Name */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-black border border-blue-100">
                        <Icon
                          icon="mdi:cog-outline"
                          className="w-3.5 h-3.5 text-black"
                        />
                        {serviceName}
                      </span>
                    </td>

                    {/* 3. Code */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {planCode}
                      </span>
                    </td>

                    {/* 4. Created Date */}
                    <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">
                      {dateCreated}
                    </td>

                    {/* 5. Actions */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-gray-500 hover:text-black rounded hover:bg-gray-100 transition mr-1"
                        title="Edit Mapping"
                      >
                        <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => askDelete(item, planName, serviceName)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition"
                        title="Delete Mapping"
                      >
                        <Icon
                          icon="mdi:trash-can-outline"
                          className="w-4 h-4"
                        />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal with Single Select Dropdowns */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900">
                {formData.id ? "Edit Plan Service" : "Add Plan Service"}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon icon="mdi:close" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              {submitError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {submitError}
                </div>
              )}

              {/* 1. Subscription Plan Dropdown */}
              <div>
                <label
                  htmlFor="plan_id"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Subscription Plan <span className="text-red-500">*</span>
                </label>
                <select
                  id="plan_id"
                  required
                  value={formData.plan_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      plan_id: e.target.value,
                      service_id: "",
                    }))
                  }
                  disabled={loadingLookups || formData.id > 0}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-black outline-none disabled:opacity-60 cursor-pointer"
                >
                  <option value="" disabled>
                    -- Select Subscription Plan --
                  </option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.title} {p.code ? `(${p.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Service Dropdown */}
              <div>
                <label
                  htmlFor="service_id"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Service <span className="text-red-500">*</span>
                </label>
                <select
                  id="service_id"
                  required
                  value={formData.service_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      service_id: e.target.value,
                    }))
                  }
                  disabled={loadingLookups || !formData.plan_id}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-black outline-none disabled:opacity-60 cursor-pointer"
                >
                  <option value="" disabled>
                    {!formData.plan_id
                      ? "-- Select Plan First --"
                      : "-- Select Service --"}
                  </option>
                  {services.map((svc) => {
                    const isAlreadyAdded = existingServiceIdsForPlan.has(
                      Number(svc.id),
                    );
                    return (
                      <option
                        key={svc.id}
                        value={svc.id}
                        disabled={isAlreadyAdded}
                      >
                        {svc.name || svc.service_name}
                        {isAlreadyAdded ? " (Already added to plan)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    loadingLookups || !formData.service_id || !formData.plan_id
                  }
                  className="px-4 py-1.5 text-xs font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {formData.id ? "Update Mapping" : "Save Mapping"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
