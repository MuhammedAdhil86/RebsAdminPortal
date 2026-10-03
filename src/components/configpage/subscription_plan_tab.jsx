import React from "react";
import MasterDataPanel from "./master_data_panel";

const SECTION = {
  key: "subscriptionPlan",
  label: "Subscription Plans",
  singular: "Subscription Plan",
  icon: "mdi:package-variant-closed",
  fields: [
    {
      name: "code",
      label: "Plan Code",
      placeholder: "e.g. HRMS_BASIC",
      required: true,
      unique: true,
      transform: "uppercase",
      maxLength: 50,
    },
    {
      name: "name",
      label: "Plan Name",
      placeholder: "e.g. HRMS Starter Pack",
      required: true,
      maxLength: 100,
    },
    {
      name: "description",
      label: "Description",
      placeholder: "e.g. Basic HRMS subscription plan",
      required: false,
      maxLength: 255,
    },
    {
      name: "plan_extension_days",
      label: "Extension Days",
      placeholder: "e.g. 30 (or 0)",
      required: true,
      pattern: /^\d+$/,
      patternMessage: "Extension days must be 0 or a positive number.",
    },
  ],
  toPayload: (values) => ({
    code: String(values.code || "")
      .trim()
      .toUpperCase(),
    name: String(values.name || "").trim(),
    description: String(values.description || "").trim(),
    is_active: true,
    allow_plan_extension: Number(values.plan_extension_days) > 0,
    plan_extension_days: Number(values.plan_extension_days || 0),
  }),
};

export default function SubscriptionPlanTab({ api }) {
  return <MasterDataPanel section={SECTION} api={api} />;
}
