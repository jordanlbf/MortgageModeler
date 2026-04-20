"use client";

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
        <p className="text-[13px] text-foreground/30">Something went wrong.</p>
        <button
          onClick={this.reset}
          className="rounded-lg px-4 py-2 text-[12px] font-medium text-accent/60 transition-colors hover:bg-white/[0.04]"
        >
          Try again
        </button>
      </div>
    );
  }
}
