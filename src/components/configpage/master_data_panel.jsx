import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import { DEBUG } from "../../services/MasterService";

/**
 * Shared list UI used by every master data tab:
 * search bar, Add button, table, Add/Edit modal and delete confirmation.
 *
 * Each tab file owns its own config and API calls and passes them in:
 *
 *   section = {
 *     key, label, singular, icon,
 *     columns?: [{ key, label, get?(item), primary?, searchable? }],
 *     fields: [{ name, label, type, options, placeholder, hint, maxLength,
 *                required, unique, transform, pattern, patternMessage, initial }],
 *     toPayload: (values) => object sent to the API (without id),
 *   }
 *
 *   api = { list(), create(payload), update(payload), remove(id) }
 *   requestDelete = ({ singular, name, onConfirm }) => void  (from MasterDataTab)
 */

const MAX_LEN = 100;

/* Console logging (development, or VITE_DEBUG_LOGS=true) */
const log = (...args) => {
  if (DEBUG) console.log("[MasterDataTab]", ...args);
};

/* ------------------------------------------------------------------ */
/*  Table helpers: show every field returned by the API except id     */
/* ------------------------------------------------------------------ */

const HIDDEN_COLUMNS = ["id"];
const COLUMN_ORDER = ["name", "code"];

// Readable label for a row (rows like pricing have no name)
const itemLabel = (item) =>
  item?.name || item?.code || (item?.id !== undefined ? `#${item.id}` : "item");

const columnLabel = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatCell = (key, value) => {
  if (value === null || value === undefined || value === "") return "—";

  // ISO timestamps such as created_on / updated_at / created_at
  if (/(_at|_on)$/.test(key)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      });
    }
  }

  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/* ------------------------------------------------------------------ */
/*  Add / Edit modal (fields are rendered dynamically from config)    */
/* ------------------------------------------------------------------ */

function ItemModal({ section, item, items, submitting, onClose, onSubmit }) {
  const { singular, fields, icon } = section;
  const isEdit = Boolean(item);

  const [values, setValues] = useState(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.name,
        item
          ? ((typeof f.initial === "function"
              ? f.initial(item)
              : item[f.name]) ?? "")
          : "",
      ]),
    ),
  );
  const [errors, setErrors] = useState({});
  const [visible, setVisible] = useState(false);
  const inputRefs = useRef({});

  const close = useCallback(() => {
    if (submitting) return;
    setVisible(false);
    setTimeout(onClose, 160);
  }, [submitting, onClose]);

  // Enter animation, focus first field, lock page scroll
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    inputRefs.current[fields[0]?.name]?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape closes the modal
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const handleChange = (field, raw) => {
    const value = field.transform === "uppercase" ? raw.toUpperCase() : raw;
    setValues((prev) => ({ ...prev, [field.name]: value }));
    if (errors[field.name]) {
      setErrors((prev) => ({ ...prev, [field.name]: "" }));
    }
  };

  const validate = () => {
    const found = {};

    fields.forEach((field) => {
      const value = String(values[field.name] ?? "").trim();

      if (field.required && !value) {
        found[field.name] = `Enter the ${field.label.toLowerCase()}.`;
        return;
      }

      if (field.maxLength && value.length > field.maxLength) {
        found[field.name] =
          `${field.label} must be ${field.maxLength} characters or fewer.`;
        return;
      }

      if (value && field.pattern && !field.pattern.test(value)) {
        found[field.name] =
          field.patternMessage || `${field.label} is invalid.`;
        return;
      }

      if (value && field.unique) {
        const duplicate = items.some(
          (other) =>
            other.id !== item?.id &&
            String(other[field.name] ?? "")
              .trim()
              .toLowerCase() === value.toLowerCase(),
        );
        if (duplicate) found[field.name] = `${field.label} already exists.`;
      }
    });

    log("modal validate", { values, errors: found });
    return found;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const found = validate();
    setErrors(found);

    const firstBad = fields.find((f) => found[f.name]);
    if (firstBad) {
      inputRefs.current[firstBad.name]?.focus();
      return;
    }

    const cleaned = Object.fromEntries(
      fields.map((f) => [f.name, String(values[f.name] ?? "").trim()]),
    );

    const ok = await onSubmit(cleaned);
    if (ok) {
      setVisible(false);
      setTimeout(onClose, 160);
    }
  };

  return createPortal(
    <div
      className={`poppins-root fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
        className={`w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-200 ${
          visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-3 scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
              <Icon icon={icon} className="w-6 h-6" />
            </div>
            <div>
              <h2 id="item-modal-title" className="text-lg text-gray-900">
                {isEdit ? "Edit" : "Add"} {singular.toLowerCase()}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEdit
                  ? "Update the details below."
                  : `Fill in the details to create a new ${singular.toLowerCase()}.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="p-1.5 -mr-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Icon
              icon="heroicons:x-mark-20-solid"
              className="w-5 h-5 text-gray-400"
            />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 pb-2 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
            {fields.map((field) => (
              <div key={field.name} className="flex flex-col gap-1.5">
                <label
                  htmlFor={`field-${field.name}`}
                  className="text-xs font-medium text-gray-700"
                >
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>

                {field.type === "select" ? (
                  <select
                    id={`field-${field.name}`}
                    ref={(el) => {
                      inputRefs.current[field.name] = el;
                    }}
                    value={values[field.name]}
                    disabled={submitting}
                    onChange={(e) => handleChange(field, e.target.value)}
                    aria-invalid={Boolean(errors[field.name])}
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 disabled:opacity-50 transition-shadow ${
                      errors[field.name] ? "border-red-400" : "border-gray-200"
                    }`}
                  >
                    <option value="">
                      {field.placeholder ||
                        `Select ${field.label.toLowerCase()}`}
                    </option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    id={`field-${field.name}`}
                    ref={(el) => {
                      inputRefs.current[field.name] = el;
                    }}
                    rows={3}
                    value={values[field.name]}
                    disabled={submitting}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder={field.placeholder}
                    maxLength={(field.maxLength || 255) + 1}
                    aria-invalid={Boolean(errors[field.name])}
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 disabled:opacity-50 transition-shadow resize-none ${
                      errors[field.name] ? "border-red-400" : "border-gray-200"
                    }`}
                  />
                ) : (
                  <input
                    id={`field-${field.name}`}
                    ref={(el) => {
                      inputRefs.current[field.name] = el;
                    }}
                    type={field.type || "text"}
                    value={values[field.name]}
                    disabled={submitting}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder={field.placeholder}
                    maxLength={(field.maxLength || MAX_LEN) + 1}
                    autoComplete="off"
                    aria-invalid={Boolean(errors[field.name])}
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 disabled:opacity-50 transition-shadow ${
                      errors[field.name] ? "border-red-400" : "border-gray-200"
                    }`}
                  />
                )}

                {errors[field.name] ? (
                  <p className="text-xs text-red-600">{errors[field.name]}</p>
                ) : (
                  field.hint && (
                    <p className="text-[11px] text-gray-400">{field.hint}</p>
                  )
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 mt-2 bg-gray-50 border-t border-gray-100">
            <button
              type="button"
              onClick={close}
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting && (
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
              )}
              {isEdit ? "Save changes" : `Add ${singular.toLowerCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/*  Master Data Panel                                                 */
/* ------------------------------------------------------------------ */

export default function MasterDataPanel({ section, api, requestDelete }) {
  const { singular, label, key, toPayload } = section;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null); // null | { item: object | null }

  /* ------------------------------------------------------------- */
  /* API: Fetch Items (GET)                                        */
  /* ------------------------------------------------------------- */
  const fetchItems = useCallback(
    async (showLoader = true) => {
      log(`fetchItems(${key})`, { showLoader });
      if (showLoader) setLoading(true);
      try {
        const data = await api.list();
        const list = Array.isArray(data) ? data : data?.data || [];
        log(`fetchItems(${key}) loaded`, list.length, "items", list);
        setItems(list);
      } catch (err) {
        log(`fetchItems(${key}) failed`, err);
        toast.error(err.message || `Error loading ${label.toLowerCase()}`);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [api, key, label],
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  /* ------------------------------------------------------------- */
  /* Search + columns                                              */
  /* ------------------------------------------------------------- */
  const columns = useMemo(() => {
    if (Array.isArray(section.columns) && section.columns.length) {
      return section.columns.map((c) => ({
        key: c.key,
        label: c.label,
        get: (item) => (c.get ? c.get(item) : item[c.key]),
        primary: Boolean(c.primary),
        searchable: c.searchable !== false && !/(_at|_on)$/.test(c.key),
      }));
    }

    const keys = [];
    items.forEach((item) => {
      Object.keys(item).forEach((k) => {
        if (!HIDDEN_COLUMNS.includes(k) && !keys.includes(k)) keys.push(k);
      });
    });

    return [
      ...COLUMN_ORDER.filter((k) => keys.includes(k)),
      ...keys.filter((k) => !COLUMN_ORDER.includes(k)),
    ].map((k) => ({
      key: k,
      label: columnLabel(k),
      get: (item) => item[k],
      primary: k === "name",
      searchable: !/(_at|_on)$/.test(k),
    }));
  }, [items, section.columns]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      columns.some((col) => {
        if (!col.searchable) return false;
        const value = col.get(item);
        return (
          value !== null &&
          value !== undefined &&
          typeof value !== "object" &&
          String(value).toLowerCase().includes(q)
        );
      }),
    );
  }, [items, columns, query]);

  /* ------------------------------------------------------------- */
  /* API: Add / Update (PUT, id 0 = create)                        */
  /* ------------------------------------------------------------- */
  const handleSave = async (values) => {
    const editing = modal?.item || null;
    log("handleSave", {
      section: key,
      mode: editing ? "update" : "create",
      values,
    });

    setSubmitting(true);
    try {
      const payload = toPayload(values);

      if (editing) {
        const body = { id: editing.id, ...payload };
        log("handleSave update payload", body);
        const result = await api.update(body);
        log("handleSave update result", result);
      } else {
        log("handleSave create payload", payload);
        const result = await api.create(payload);
        log("handleSave create result", result);
      }

      await fetchItems(false);
      toast.success(`${singular} ${editing ? "updated" : "added"}.`);
      return true;
    } catch (err) {
      log("handleSave failed", err);
      toast.error(
        err.message ||
          `Failed to ${editing ? "update" : "add"} ${singular.toLowerCase()}`,
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------------------------------------- */
  /* API: Delete Item (DELETE)                                     */
  /* ------------------------------------------------------------- */
  const handleDelete = async (item) => {
    log("handleDelete", { section: key, item });
    setSubmitting(true);
    try {
      const result = await api.remove(item.id);
      log("handleDelete result", result);

      setItems((prev) => prev.filter((current) => current.id !== item.id));
      toast.success(`${singular} deleted.`);
      return true;
    } catch (err) {
      log("handleDelete failed", err);
      toast.error(err.message || `Failed to delete ${singular.toLowerCase()}`);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Opens the shared DeleteConfirmModal (provided by MasterDataTab).
  // No window.confirm fallback: if a tab forgets to pass requestDelete,
  // it is reported immediately instead of silently using the browser popup.
  const askDelete = (item) => {
    console.log("askDelete", {
      section: key,
      requestDelete: typeof requestDelete,
    });

    if (typeof requestDelete !== "function") {
      console.error(`requestDelete missing for section "${key}"`);
      toast.error(`Delete modal not connected for "${label}".`);
      return;
    }

    requestDelete({
      singular,
      name: itemLabel(item),
      onConfirm: () => handleDelete(item),
    });
  };

  const openAdd = () => {
    log("openAdd", key);
    setModal({ item: null });
  };

  const openEdit = (item) => {
    log("openEdit", item);
    setModal({ item });
  };

  const closeModal = () => {
    log("closeModal");
    setModal(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: search (left) + add (right) */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}`}
            aria-label={`Search ${label.toLowerCase()}`}
            className="w-full pl-10 pr-9 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-shadow"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
            >
              <Icon icon="mdi:close" className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 transition-colors shrink-0 shadow-sm"
        >
          <Icon icon="mdi:plus" className="w-4 h-4" />
          Add {singular.toLowerCase()}
        </button>
      </div>

      {/* Table-style List Box */}
      <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
          <span>{label}</span>
          <span>
            {query.trim()
              ? `${filtered.length} of ${items.length}`
              : `${items.length} total`}
          </span>
        </div>

        {loading ? (
          <div className="py-14 text-center text-sm text-gray-400">
            <Icon
              icon="mdi:loading"
              className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-500"
            />
            Loading {label.toLowerCase()}...
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center text-sm text-gray-400">
            <Icon
              icon="solar:document-text-linear"
              className="w-10 h-10 mx-auto mb-2 opacity-60"
            />
            No {label.toLowerCase()} added yet
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-gray-400">
            <Icon
              icon="mdi:magnify"
              className="w-10 h-10 mx-auto mb-2 opacity-60"
            />
            No results for &ldquo;{query.trim()}&rdquo;
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50/60 text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className="px-5 py-2.5 font-medium whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-5 py-2.5 font-medium text-right"
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-5 py-3.5 ${
                            col.primary
                              ? "text-gray-800"
                              : "text-gray-500 whitespace-nowrap"
                          }`}
                        >
                          {formatCell(col.key, col.get(item))}
                        </td>
                      ))}

                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Edit"
                            disabled={submitting}
                            aria-label={`Edit ${itemLabel(item)}`}
                            onClick={() => openEdit(item)}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-black transition-colors disabled:opacity-40"
                          >
                            <Icon
                              icon="mdi:pencil-outline"
                              className="w-[18px] h-[18px]"
                            />
                          </button>

                          <button
                            type="button"
                            title="Delete"
                            disabled={submitting}
                            aria-label={`Delete ${itemLabel(item)}`}
                            onClick={() => askDelete(item)}
                            className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                          >
                            <Icon
                              icon="mdi:trash-can-outline"
                              className="w-[18px] h-[18px]"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <ItemModal
          key={modal.item?.id ?? "new"}
          section={section}
          item={modal.item}
          items={items}
          submitting={submitting}
          onClose={closeModal}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}
