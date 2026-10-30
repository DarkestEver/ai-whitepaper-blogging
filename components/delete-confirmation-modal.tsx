"use client";

import { showToast } from "@/lib/toast-utils";
import { useState } from "react";

interface DeleteConfirmationModalProps {
  itemName: string;
  itemId: number;
  onClose: () => void;
  onSuccess?: () => void;
  deleteUrl: string;
}

export function DeleteConfirmationModal({
  itemName,
  itemId,
  onClose,
  onSuccess,
  deleteUrl,
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch(deleteUrl, { method: "POST" });

      if (!response.ok) {
        const error = await response.json();
        showToast.deleteFailed(error.message);
        return;
      }

      showToast.siteDeleted();
      onSuccess?.();
      // Redirect to sites list after successful delete
      setTimeout(() => {
        window.location.href = "/admin/sites";
      }, 500);
    } catch (error) {
      showToast.deleteFailed(error instanceof Error ? error.message : undefined);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 999 }} />
      <div className="modal-dialog" style={{ zIndex: 1000 }}>
        <div className="modal-header">
          <h2>Delete "{itemName}"?</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "var(--muted)",
            }}
          >
            ✕
          </button>
        </div>
        <div className="modal-body" style={{ padding: "24px" }}>
          <p style={{ marginTop: 0, color: "var(--muted)" }}>
            This action cannot be undone. All associated data will be permanently deleted.
          </p>
          <p style={{ marginBottom: 0, fontWeight: 600, color: "var(--ink)" }}>
            Are you absolutely sure?
          </p>
        </div>
        <div
          className="modal-footer"
          style={{
            display: "flex",
            gap: "12px",
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="button"
            style={{
              flex: 1,
              background: "var(--paper-secondary)",
              border: "1px solid var(--border)",
            }}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="button button-dark"
            style={{
              flex: 1,
              background: "#dc2626",
              borderColor: "#dc2626",
            }}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </>
  );
}
