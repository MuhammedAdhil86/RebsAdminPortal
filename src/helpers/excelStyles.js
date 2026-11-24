// Common thin black border for all cells
export const borderStyle = {
  top: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

// Title row style (e.g., "TIMESHEET REPORT")
export const titleStyle = {
  font: {
    bold: true,
    size: 14,
  },
  alignment: {
    horizontal: "left",
    vertical: "middle",
  },
};

// Header row style (WORK DATE, PROJECT, TASK, etc.)
export const headerStyle = {
  font: {
    bold: true,
  },
  alignment: {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  },
  fill: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF2F2F2" },
  },
  border: borderStyle,
};

// Normal text cell (Project, Task, Remarks, etc.)
export const textCellStyle = {
  alignment: {
    horizontal: "left",
    vertical: "middle",
  },
  border: borderStyle,
};

// Centered text cell (Dates, Times, Status, etc.)
export const centerCellStyle = {
  alignment: {
    horizontal: "center",
    vertical: "middle",
  },
  border: borderStyle,
};

// Number cell (Duration, Minutes, Hours, etc.)
export const numberCellStyle = {
  alignment: {
    horizontal: "right",
    vertical: "middle",
  },
  border: borderStyle,
};

// Total row style
export const totalRowStyle = {
  font: {
    bold: true,
  },
  alignment: {
    horizontal: "right",
    vertical: "middle",
  },
  border: borderStyle,
};