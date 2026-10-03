import React from "react";
import MasterDataPanel from "./master_data_panel";

/**
 * Organisation types tab: form fields only.
 * The API (list / create / update / remove) is passed in by MasterDataTab.
 */

const SECTION = {
  key: "organisationType",
  label: "Organisation Types",
  singular: "Organisation type",
  icon: "mdi:domain",
  fields: [
    {
      name: "name",
      label: "Organisation type name",
      placeholder: "e.g. Private Limited",
      maxLength: 100,
      required: true,
      unique: true,
    },
  ],
  toPayload: (values) => ({ name: values.name }),
};

export default function OrganisationTypeTab({ api }) {
  return <MasterDataPanel section={SECTION} api={api} />;
}
