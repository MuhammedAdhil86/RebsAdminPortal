import React from "react";
import MasterDataPanel from "./master_data_panel";

/**
 * Countries tab: form fields only.
 * The API (list / create / update / remove) is passed in by MasterDataTab.
 */

const SECTION = {
  key: "country",
  label: "Countries",
  singular: "Country",
  icon: "mdi:earth",
  fields: [
    {
      name: "name",
      label: "Country name",
      placeholder: "e.g. India",
      maxLength: 100,
      required: true,
      unique: true,
    },
    {
      name: "code",
      label: "Country code",
      placeholder: "e.g. IN",
      hint: "2 to 3 letter code",
      maxLength: 3,
      required: true,
      unique: true,
      transform: "uppercase",
      pattern: /^[A-Za-z]{2,3}$/,
      patternMessage: "Use a 2 to 3 letter code, e.g. IN.",
    },
  ],
  toPayload: (values) => ({ name: values.name, code: values.code }),
};

export default function CountryTab({ api }) {
  return <MasterDataPanel section={SECTION} api={api} />;
}
