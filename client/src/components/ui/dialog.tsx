"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Dialog({ open, title, description, onClose, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="w-[calc(100%-2rem)] max-w-xl rounded-3xl border border-line bg-white p-0 text-ink shadow-dialog backdrop:bg-ink/45 backdrop:backdrop-blur-sm"
      aria-labelledby="dialog-title"
      aria-describedby={description ? "dialog-description" : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex items-start justify-between gap-6 border-b border-line px-6 py-5 sm:px-8">
        <div>
          <h2 id="dialog-title" className="font-serif text-2xl">{title}</h2>
          {description ? <p id="dialog-description" className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
        </div>
        <button
          type="button"
          className="rounded-full p-2 text-muted transition hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-focus"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="px-6 py-6 sm:px-8">{children}</div>
    </dialog>
  );
}
