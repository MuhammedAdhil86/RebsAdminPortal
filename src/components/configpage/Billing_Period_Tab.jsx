import React from "react";
import MasterDataPanel from "./master_data_panel";

/**
 * Billing Period tab: configuration & form fields only.
 * The API (list / create / update / remove) and the delete modal
 * request (requestDelete) are passed in by MasterDataTab.
 */

const SECTION = {
  key: "billingPeriod",
  label: "Billing Periods",
  singular: "Billing Period",
  icon: "mdi:calendar-clock-outline",
  fields: [
    {
      name: "code",
      label: "Code",
      placeholder: "e.g. MONTHLY",
      required: true,
      unique: true,
      transform: "uppercase",
      maxLength: 50,
    },
    {
      name: "name",
      label: "Period Name",
      placeholder: "e.g. Monthly",
      required: true,
      maxLength: 100,
    },
    {
      name: "months",
      label: "Duration (Months)",
      placeholder: "e.g. 1",
      required: true,
      pattern: /^[1-9]\d*$/,
      patternMessage: "Duration must be a positive integer greater than 0.",
    },
    {
      name: "description",
      label: "Description",
      placeholder: "e.g. Billed every month",
      required: false,
      maxLength: 255,
    },
  ],
  toPayload: (values) => ({
    code: String(values.code || "")
      .trim()
      .toUpperCase(),
    name: String(values.name || "").trim(),
    months: Number(values.months),
    description: String(values.description || "").trim(),
  }),
};

export default function BillingPeriodTab({ api, requestDelete }) {
  return (
    <MasterDataPanel
      section={SECTION}
      api={api}
      requestDelete={requestDelete}
    />
  );
}
