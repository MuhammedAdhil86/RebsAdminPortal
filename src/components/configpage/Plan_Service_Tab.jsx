import React from "react";
import MasterDataPanel from "./master_data_panel";

/**
 * Plan Service tab: form fields only.
 * The API (list / create / update / remove) is passed in by MasterDataTab.
 */

const SECTION = {
  key: "planService",
  label: "Plan Services",
  singular: "Plan Service",
  icon: "mdi:link-variant",
  fields: [
    {
      name: "plan_id",
      label: "Plan ID",
      placeholder: "e.g. 1",
      hint: "Numeric ID of the subscription plan",
      maxLength: 10,
      required: true,
      pattern: /^[1-9]\d*$/,
      patternMessage: "Enter a valid positive Plan ID.",
    },
    {
      name: "service_id",
      label: "Service ID",
      placeholder: "e.g. 1",
      hint: "Numeric ID of the service",
      maxLength: 10,
      required: true,
      pattern: /^[1-9]\d*$/,
      patternMessage: "Enter a valid positive Service ID.",
    },
  ],
  toPayload: (values) => ({
    plan_id: Number(values.plan_id),
    service_id: Number(values.service_id),
  }),
};

export default function PlanServiceTab({ api }) {
  return <MasterDataPanel section={SECTION} api={api} />;
}
