import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

afterEach(cleanup);

/** Opens from a plain button (no DialogTrigger), like our controlled dialogs. */
function Harness({ kind }: { kind: "dialog" | "sheet" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      {kind === "dialog" ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent variant="bare"><DialogTitle>Panel</DialogTitle><button type="button">Inside</button></DialogContent>
        </Dialog>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent variant="bare"><SheetTitle>Panel</SheetTitle><button type="button">Inside</button></SheetContent>
        </Sheet>
      )}
    </>
  );
}

describe.each(["dialog", "sheet"] as const)("%s opened without a Radix trigger", (kind) => {
  it("returns focus to the opening button on Escape", async () => {
    render(<Harness kind={kind} />);
    const opener = screen.getByRole("button", { name: "Open" });
    opener.focus();
    fireEvent.click(opener);
    await screen.findByRole("dialog");
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(opener);
  });
});
