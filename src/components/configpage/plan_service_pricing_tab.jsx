import React from "react";
import MasterDataPanel from "./master_data_panel";

/**
 * Plan Service Pricing tab: configuration & form fields only.
 * Handled via MasterDataPanel and connected to MasterDataTab API.
 */

const SECTION = {
  key: "planServicePricing",
  label: "Plan Service Pricings",
  singular: "Plan Service Pricing",
  icon: "mdi:tag-outline",
  fields: [
    {
      name: "plan_service_id",
      label: "Plan Service ID",
      placeholder: "e.g. 1",
      hint: "Numeric ID of the plan service mapping",
      maxLength: 10,
      required: true,
      pattern: /^[1-9]\d*$/,
      patternMessage: "Enter a valid positive Plan Service ID.",
    },
    {
      name: "billing_period_id",
      label: "Billing Period ID",
      placeholder: "e.g. 1",
      hint: "Numeric ID of the billing period",
      maxLength: 10,
      required: true,
      pattern: /^[1-9]\d*$/,
      patternMessage: "Enter a valid positive Billing Period ID.",
    },
    {
      name: "included_users",
      label: "Included Users",
      placeholder: "e.g. 10",
      hint: "Number of free/base users included in this tier",
      maxLength: 6,
      required: true,
      pattern: /^\d+$/,
      patternMessage: "Included users must be 0 or a positive number.",
    },
    {
      name: "base_amount",
      label: "Base Amount",
      placeholder: "e.g. 999.00",
      hint: "Base price for this billing cycle",
      maxLength: 12,
      required: true,
      pattern: /^\d+(\.\d{1,2})?$/,
      patternMessage: "Enter a valid amount (e.g. 999 or 999.00).",
    },
    {
      name: "additional_user_price",
      label: "Additional User Price",
      placeholder: "e.g. 100.00",
      hint: "Price per extra user beyond included count",
      maxLength: 12,
      required: true,
      pattern: /^\d+(\.\d{1,2})?$/,
      patternMessage: "Enter a valid amount (e.g. 100 or 100.00).",
    },
  ],
  toPayload: (values) => ({
    plan_service_id: Number(values.plan_service_id),
    billing_period_id: Number(values.billing_period_id),
    included_users: Number(values.included_users),
    base_amount: Number(values.base_amount),
    additional_user_price: Number(values.additional_user_price),
  }),
};

export default function PlanServicePricingTab({ api }) {
  return <MasterDataPanel section={SECTION} api={api} />;
}
