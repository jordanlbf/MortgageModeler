"use client";

import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ModalWizardShellProps {
  isOpen: boolean;
  onClose: () => void;
  /** Composition of the wizard sidebar + WizardShell-derived step. */
  children: ReactNode;
  /** Override the modal width. Default is 920px. */
  maxWidth?: number;
  /** Baseline height — modal grows beyond this when content needs more room. Default 640px. */
  minHeight?: number;
  /** Accessible dialog name (visually hidden). */
  title?: string;
}

/**
 * Centred wizard modal on a Radix Dialog (variant `bare`): blurred black
 * overlay, glass card that pops in, our own close button. Radix provides
 * Escape / outside-click close, the focus trap, focus return and scroll lock.
 */
export default function ModalWizardShell({
  isOpen,
  onClose,
  children,
  maxWidth = 920,
  minHeight = 640,
  title = "Edit property",
}: ModalWizardShellProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        ref={contentRef}
        variant="bare"
        aria-describedby={undefined}
        overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-overlay-in"
        className="fixed inset-0 z-50 flex items-center justify-center p-6 outline-none"
        // The full-screen wrapper only centres the card: let clicks beside the
        // card fall through to the overlay so they close the dialog.
        style={{ pointerEvents: "none" }}
        // Nothing was focused on open before; keep it that way visually by
        // focusing the dialog itself instead of its first button.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          contentRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Modal Card */}
        <div
          className="pointer-events-auto relative w-full rounded-2xl overflow-hidden shadow-[0_24px_80px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset] animate-card-pop-in flex bg-surface-raised/80 backdrop-blur-xl border border-white/[0.06] transition-[min-height] duration-300 ease-out"
          style={{
            maxWidth: `${maxWidth}px`,
            minHeight: `${minHeight}px`,
            maxHeight: "calc(100vh - 48px)",
          }}
        >
          <DialogClose asChild>
            <Button
              type="button"
              variant="icon-filled"
              size="icon"
              aria-label="Close"
              className="absolute top-4 right-4 z-20"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogClose>

          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
