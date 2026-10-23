import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Palette } from "lucide-react";

const colorOptions = [
  { name: "Green", hex: "#0FBA74" },
  { name: "Red", hex: "#FF0055" },
  { name: "Purple", hex: "#5B5B9E" },
  { name: "Orange", hex: "#FFA500" },
];

const ColorPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const colorInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Input */}
      <div
        onClick={() => setOpen(!open)}
        className="w-full px-4 bg-[#F4F6F8] border border-gray-200 rounded-xl text-sm text-[#797979] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all h-12 flex items-center justify-between cursor-pointer"
      >
        <span>{value ? value : "Choose Color"}</span>
        <ChevronDown size={18} />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          {/* Custom Color */}
          <div
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer"
            onClick={() => colorInputRef.current.click()}
          >
            <Palette size={18} />
            <span className="text-sm">Choose Custom Color</span>
          </div>

          <input
            ref={colorInputRef}
            type="color"
            className="hidden"
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(false);
            }}
          />

          <div className="border-t" />

          {/* Preset colors */}
          {colorOptions.map((color) => (
            <div
              key={color.hex}
              onClick={() => {
                onChange(color.hex);
                setOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer"
            >
              <Palette size={18} />
              <span className="flex-1 text-sm">
                {color.name} - {color.hex}
              </span>
              <span
                className="w-6 h-6 rounded-md"
                style={{ backgroundColor: color.hex }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
