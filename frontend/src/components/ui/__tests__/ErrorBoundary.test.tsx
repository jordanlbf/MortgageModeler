import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

afterEach(cleanup);

// A component that throws on demand
function Thrower({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("boom");
  return <p>All good</p>;
}

describe("ErrorBoundary", () => {
  // Suppress console.error noise from React error boundary internals
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <p>Hello</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("catches error and renders default fallback message", () => {
    render(
      <ErrorBoundary>
        <Thrower shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("catches error and renders custom fallback when provided", () => {
    render(
      <ErrorBoundary
        fallback={(error, reset) => (
          <div>
            <p>Custom: {error.message}</p>
            <button onClick={reset}>Reset</button>
          </div>
        )}
      >
        <Thrower shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Custom: boom")).toBeInTheDocument();
  });

  it("resets error state and re-renders children on Try again click", () => {
    let shouldThrow = true;

    function ConditionalThrower() {
      if (shouldThrow) throw new Error("boom");
      return <p>Recovered</p>;
    }

    render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();

    // Fix the error condition, then click reset
    shouldThrow = false;
    fireEvent.click(screen.getByText("Try again"));

    expect(screen.getByText("Recovered")).toBeInTheDocument();
  });
});
