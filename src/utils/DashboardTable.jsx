import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * DashboardTable – shared table used by every dashboard tab.
 *
 * Props
 *  - columns:         [{ label, key, width?, align?, render?(value, row, rowIndex) }]
 *                     align: "left" | "center" | "right" (default "center", as before).
 *                     The header and the cells of a column always share the same align.
 *  - data:            array of rows (give each row a unique `id`)
 *  - rowsPerPage:     rows shown per page (default 6)
 *  - className:       extra classes for the outer wrapper
 *  - onRowClick:      optional, called with the row when a row is clicked
 *  - rowClickHandler: same as onRowClick (kept so both names work)
 *
 * One <table> with fixed column widths is used for header and body, so
 * columns can never drift out of line. Plain-text cells are truncated with an
 * ellipsis and show the full value on hover.
 */

const ALIGN_CLASSES = {
  left: { text: "text-left", flex: "justify-start" },
  center: { text: "text-center", flex: "justify-center" },
  right: { text: "text-right", flex: "justify-end" },
};

const getAlign = (align) => ALIGN_CLASSES[align] || ALIGN_CLASSES.center;

const isEmpty = (v) => v === null || v === undefined || v === "";

function DashboardTable({
  columns = [],
  data = [],
  rowsPerPage = 6,
  className = "",
  onRowClick,
  rowClickHandler,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const handleRowClick = onRowClick ?? rowClickHandler;

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages); // stays valid after a search
  const startIdx = (page - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentData = data.slice(startIdx, endIdx);

  // The table never gets narrower than its columns; it scrolls sideways instead
  const minTableWidth = columns.reduce((sum, c) => sum + (c.width || 140), 0);

  return (
    <section
      className={`rounded-2xl bg-white border border-gray-200 overflow-hidden relative z-[1] w-full ${className}`}
    >
      <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <table
          className="w-full table-fixed border-collapse"
          style={{ minWidth: Math.max(minTableWidth, 600) }}
        >
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.key}
                style={col.width ? { width: `${col.width}px` } : undefined}
              />
            ))}
          </colgroup>

          {/* Header */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => {
                const a = getAlign(col.align);
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 h-11 align-middle whitespace-nowrap text-[11.5px] font-semibold uppercase tracking-wide text-gray-500 ${a.text}`}
                  >
                    <div className={`flex items-center min-w-0 ${a.flex}`}>
                      <span className="truncate">{col.label}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="text-gray-800">
            {currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="h-32 text-center text-[12.5px] text-gray-400"
                >
                  No data available
                </td>
              </tr>
            ) : (
              currentData.map((row, rowIdx) => (
                <tr
                  key={row.id ?? rowIdx}
                  className={`border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50 ${
                    handleRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => handleRowClick && handleRowClick(row)}
                >
                  {columns.map((col) => {
                    const value = row[col.key];
                    const a = getAlign(col.align);
                    return (
                      <td
                        key={col.key}
                        data-label={col.label}
                        className={`px-4 h-14 align-middle overflow-hidden text-[12.5px] ${a.text}`}
                      >
                        <div className={`flex items-center min-w-0 ${a.flex}`}>
                          {col.render ? (
                            col.render(value, row, rowIdx)
                          ) : (
                            <span
                              className="truncate"
                              title={isEmpty(value) ? undefined : String(value)}
                            >
                              {isEmpty(value) ? "—" : String(value)}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 border-t border-gray-200 text-[12.5px]">
          <span className="text-gray-500">
            Showing {startIdx + 1}-{Math.min(endIdx, data.length)} of{" "}
            {data.length}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[12px]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => page > 1 && setCurrentPage(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => page < totalPages && setCurrentPage(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default DashboardTable;
