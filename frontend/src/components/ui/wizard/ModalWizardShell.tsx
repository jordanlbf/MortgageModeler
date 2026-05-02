"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalWizardShellProps {
  isOpen: boolean;
  onClose: () => void;
  /** Composition of the wizard sidebar + WizardShell-derived step. */
  children: ReactNode;
  /** Override the modal width. Default is 920px. */
  maxWidth?: number;
  /** Baseline height — modal grows beyond this when content needs more room. Default 640px. */
  minHeight?: number;
}

export default function ModalWizardShell({
  isOpen,
  onClose,
  children,
  maxWidth = 920,
  minHeight = 640,
}: ModalWizardShellProps) {
  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-overlay-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-[0_24px_80px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset] animate-card-pop-in flex bg-surface-raised/80 backdrop-blur-xl border border-white/[0.06] transition-[min-height] duration-300 ease-out"
        style={{
          maxWidth: `${maxWidth}px`,
          minHeight: `${minHeight}px`,
          maxHeight: "calc(100vh - 48px)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] text-fg-tertiary hover:text-fg-primary hover:bg-white/[0.08] transition-all duration-150 hover:scale-105"
        >
          <X className="w-4 h-4" />
        </button>

        {children}
      </div>
    </div>
  );
}
