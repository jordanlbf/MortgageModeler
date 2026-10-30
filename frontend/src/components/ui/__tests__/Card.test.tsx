import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createRef } from "react";
import { Card } from "@/components/ui/card";

afterEach(cleanup);

describe("Card variant=glass", () => {
  it("renders children", () => {
    render(<Card variant="glass"><p>Hello</p></Card>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies the glass look plus additional className", () => {
    const { container } = render(
      <Card variant="glass" className="my-custom-class">content</Card>,
    );
    const el = container.firstElementChild;
    expect(el).toHaveClass("my-custom-class");
    expect(el).toHaveClass("rounded-2xl", "bg-surface-raised", "backdrop-blur-md");
    expect(el).toHaveAttribute("data-variant", "glass");
    // none of the stock card layout leaks in
    expect(el).not.toHaveClass("flex-col");
    expect(el).not.toHaveClass("ring-1");
  });

  it("forwards ref to the wrapper div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card variant="glass" ref={ref}>ref test</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.textContent).toBe("ref test");
  });

  it("applies inline style prop", () => {
    const { container } = render(
      <Card variant="glass" style={{ padding: "20px" }}>styled</Card>,
    );
    expect(container.firstElementChild).toHaveStyle({ padding: "20px" });
  });

  it("stock variant keeps the shadcn look", () => {
    const { container } = render(<Card>stock</Card>);
    expect(container.firstElementChild).toHaveClass("rounded-xl", "flex-col");
  });
});
