import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * DashboardTable – shared table used by every dashboard tab.
 *
 * Props
 *  - columns:         [{ label, key, width, render?(value, row, rowIndex) }]
 *  - data:            array of rows (give each row a unique `id`)
 *  - rowsPerPage:     rows shown per page (default 6)
 *  - className:       extra classes for the outer wrapper
 *  - onRowClick:      optional, called with the row when a row is clicked
 *  - rowClickHandler: same as onRowClick (kept so both names work)
 */
function DashboardTable({
  columns,
  data,
  rowsPerPage = 6,
  className = "",
  onRowClick,
  rowClickHandler,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [colWidths, setColWidths] = useState([]);
  const headerRef = useRef(null);

  const handleRowClick = onRowClick ?? rowClickHandler;

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages); // stays valid after a search
  const startIdx = (page - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentData = data.slice(startIdx, endIdx);

  // Measure header columns so the body table lines up with the header table
  useEffect(() => {
    if (headerRef.current) {
      const widths = Array.from(headerRef.current.querySelectorAll("th")).map(
        (th) => th.offsetWidth,
      );
      setColWidths(widths);
    }
  }, [data, columns]);

  const widthStyle = (idx, col) => ({
    width: colWidths[idx]
      ? `${colWidths[idx]}px`
      : col.width
        ? `${col.width}px`
        : "auto",
  });

  return (
    <section
      className={`p-1 rounded-2xl overflow-x-auto relative z-[1] w-full ${className}`}
    >
      {/* Header */}
      <table
        className="w-full min-w-[600px] text-[12px] bg-white border-separate border-spacing-0 rounded-2xl overflow-hidden"
        ref={headerRef}
      >
        <thead className="bg-white text-gray-600 text-[12.5px]">
          <tr className="rounded-lg overflow-hidden">
            {columns.map((col, idx) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-medium text-gray-700 text-center whitespace-nowrap align-middle 
                ${
                  idx === 0
                    ? "rounded-tl-2xl"
                    : idx === columns.length - 1
                      ? "rounded-tr-2xl"
                      : ""
                }`}
                style={widthStyle(idx, col)}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
      </table>

      <div className="h-2" />

      {/* Body */}
      <table className="w-full min-w-[600px] bg-white border-separate border-spacing-0 rounded-2xl overflow-hidden">
        <tbody className="text-gray-800">
          {currentData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-4 text-gray-500 border-b border-gray-300"
              >
                No data available
              </td>
            </tr>
          ) : (
            currentData.map((row, rowIdx) => (
              <tr
                key={row.id ?? rowIdx}
                className={`hover:bg-gray-50 text-center relative z-[0] border-b border-gray-300 ${
                  handleRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => handleRowClick && handleRowClick(row)}
              >
                {columns.map((col, colIdx) => {
                  const value = row[col.key];
                  const content = col.render
                    ? col.render(value, row, rowIdx)
                    : value;
                  return (
                    <td
                      key={col.key}
                      data-label={col.label}
                      className="px-4 py-4 truncate text-center align-middle relative text-[12px] border-b border-[#f9fafb]"
                      style={widthStyle(colIdx, col)}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}

          {/* Pagination */}
          {data.length > 0 && (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 text-[12.5px]">
                  <span className="text-gray-500">
                    Showing {startIdx + 1}-{Math.min(endIdx, data.length)} of{" "}
                    {data.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => page > 1 && setCurrentPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 rounded disabled:opacity-50 hover:bg-gray-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        page < totalPages && setCurrentPage(page + 1)
                      }
                      disabled={page === totalPages}
                      className="p-2 rounded disabled:opacity-50 hover:bg-gray-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export default DashboardTable;
