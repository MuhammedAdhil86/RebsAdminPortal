import React from "react";
import { Icon } from "@iconify/react";

/**
 * Shared select used across the app so every dropdown has the same size/look.
 *
 * Props:
 *  - label      optional inline label ("Label:")
 *  - value      current value
 *  - options    array of strings OR { value, label }
 *  - onChange   (value: string) => void
 *  - minWidth   px fallback width (default 120)
 *  - fullWidth  NEW, optional. Stretch to the parent's width (for modals/forms)
 *  - disabled   NEW, optional
 *  - ariaLabel  NEW, optional
 */
export default function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  minWidth = 120,
  fullWidth = false,
  disabled = false,
  ariaLabel,
}) {
  // Compute width based on the longest option
  const longestOptionLength = Math.max(
    0,
    ...options.map((opt) => (opt.label ?? opt).toString().length),
  );

  // width in ch + padding, then min-width in px fallback
  const widthCh = Math.max(longestOptionLength + 4, 8); // 8ch min

  return (
    <div className={`flex items-center gap-2 ${fullWidth ? "w-full" : ""}`}>
      {label && <span className="text-xs whitespace-nowrap">{label}:</span>}
      <div className={`relative ${fullWidth ? "w-full" : ""}`}>
        <select
          value={value}
          disabled={disabled}
          aria-label={ariaLabel || label}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none border border-gray-300 bg-white px-3 pr-8 py-2 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
          style={{
            width: fullWidth ? "100%" : `${widthCh}ch`,
            minWidth: fullWidth ? undefined : `${minWidth}px`,
            borderRadius: "6px", // options box radius
          }}
        >
          {options.map((opt) => (
            <option
              key={opt.value ?? opt}
              value={opt.value ?? opt}
              style={{
                borderBottom: "1px solid #e5e7eb", // every option border bottom
                padding: "8px",
              }}
            >
              {opt.label ?? opt}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <Icon icon="mdi:chevron-down" className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
}
