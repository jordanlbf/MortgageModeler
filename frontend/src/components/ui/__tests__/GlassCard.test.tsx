import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createRef } from "react";
import GlassCard from "@/components/ui/GlassCard";

afterEach(cleanup);

describe("GlassCard", () => {
  it("renders children", () => {
    render(<GlassCard><p>Hello</p></GlassCard>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies additional className", () => {
    const { container } = render(
      <GlassCard className="my-custom-class">content</GlassCard>,
    );
    expect(container.firstElementChild).toHaveClass("my-custom-class");
    // should also keep the base class
    expect(container.firstElementChild).toHaveClass("glass-card");
  });

  it("forwards ref to the wrapper div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<GlassCard ref={ref}>ref test</GlassCard>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.textContent).toBe("ref test");
  });

  it("applies inline style prop", () => {
    const { container } = render(
      <GlassCard style={{ padding: "20px" }}>styled</GlassCard>,
    );
    expect(container.firstElementChild).toHaveStyle({ padding: "20px" });
  });
});
