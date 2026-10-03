import React from "react";
import MasterDataPanel from "./master_data_panel";

/**
 * Services tab: form fields only.
 * The API (list / create / update / remove) is passed in by MasterDataTab.
 */

const SECTION = {
  key: "service",
  label: "Services",
  singular: "Service",
  icon: "mdi:briefcase-outline",
  fields: [
    {
      name: "name",
      label: "Service name",
      placeholder: "e.g. HRMS",
      maxLength: 100,
      required: true,
      unique: true,
    },
  ],
  toPayload: (values) => ({ name: values.name }),
};

export default function ServiceTab({ api }) {
  return <MasterDataPanel section={SECTION} api={api} />;
}
