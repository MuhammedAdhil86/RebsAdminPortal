import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { DEBUG } from "../../services/MasterService";

/* Console logging (development, or VITE_DEBUG_LOGS=true) */
const log = (...args) => {
  if (DEBUG) console.log("[MasterDataTab]", ...args);
};

export default function DeleteConfirmModal({ request, onClose }) {
  const { singular, name, onConfirm } = request;

  const [visible, setVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cancelRef = useRef(null);

  const close = useCallback(() => {
    if (deleting) return;
    setVisible(false);
    setTimeout(onClose, 160);
  }, [deleting, onClose]);

  // Enter animation, focus the safe button, lock page scroll
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    cancelRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Escape closes the modal
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const confirm = async () => {
    if (deleting) return;
    log("delete confirmed", { singular, name });
    setDeleting(true);

    const ok = await onConfirm();
    log("delete finished", { ok });

    setDeleting(false);
    if (ok) {
      setVisible(false);
      setTimeout(onClose, 160);
    }
  };

  return createPortal(
    <div
      className={`poppins-root fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-desc"
        className={`w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-200 ${
          visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-3 scale-95"
        }`}
      >
        <div className="px-6 pt-6 pb-5 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <Icon icon="mdi:trash-can-outline" className="w-6 h-6" />
          </div>

          <h2 id="delete-modal-title" className="text-lg text-gray-900">
            Delete {singular.toLowerCase()}?
          </h2>

          <p id="delete-modal-desc" className="mt-1.5 text-sm text-gray-500">
            You are about to delete{" "}
            <span className="font-medium text-gray-800">
              &ldquo;{name}&rdquo;
            </span>
            . This action can&apos;t be undone.
          </p>
        </div>

        <div className="flex gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            ref={cancelRef}
            type="button"
            onClick={close}
            disabled={deleting}
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={confirm}
            disabled={deleting}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deleting && (
              <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
