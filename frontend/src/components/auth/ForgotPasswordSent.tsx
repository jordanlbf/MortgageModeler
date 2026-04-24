"use client";

import { Mail } from "lucide-react";
import AuthCard from "./AuthCard";
import BackToSignIn from "./BackToSignIn";
import MortgageModelerLogo from "./MortgageModelerLogo";

interface Props {
  email: string;
  onRetry: () => void;
}

export default function ForgotPasswordSent({ email, onRetry }: Props) {
  const displayEmail = email || "your email";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <div className="animate-fade-up" style={{ marginBottom: 32, animationDelay: "0ms" }}>
        <MortgageModelerLogo size={36} />
      </div>

      <AuthCard asDiv>
        <div style={{ textAlign: "center" }}>
          <div
            className="auth-pulse-ring"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "color-mix(in srgb, var(--color-brand) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-brand) 30%, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
            aria-hidden="true"
          >
            <Mail size={22} strokeWidth={2} color="var(--color-brand)" />
          </div>

          <h1
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: "var(--color-fg-primary)",
              letterSpacing: "-0.015em",
              marginBottom: 10,
            }}
          >
            Check your email
          </h1>

          <p
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: "var(--color-fg-secondary)",
              lineHeight: 1.55,
              marginBottom: 24,
            }}
          >
            If an account exists for that address, we&apos;ve sent a password reset link to
            <br />
            <span
              style={{
                display: "inline-block",
                color: "var(--color-fg-primary)",
                background: "var(--color-surface-raised)",
                padding: "2px 10px",
                borderRadius: 6,
                fontWeight: 500,
                fontSize: 13,
                border: "1px solid var(--color-border-default)",
                marginTop: 4,
              }}
            >
              {displayEmail}
            </span>
          </p>

          <div
            style={{
              padding: "14px 16px",
              background: "var(--color-surface-raised)",
              border: "1px solid var(--color-border-default)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--color-fg-tertiary)",
              lineHeight: 1.55,
              textAlign: "left",
              marginBottom: 20,
            }}
          >
            <strong style={{ color: "var(--color-fg-secondary)", fontWeight: 500 }}>
              Didn&apos;t see it?
            </strong>{" "}
            Check your spam folder, or give it a minute. Emails can take up to a few minutes to
            arrive.
          </div>

          <button
            type="button"
            onClick={onRetry}
            style={{
              width: "100%",
              height: 44,
              background: "transparent",
              color: "var(--color-fg-primary)",
              border: "1px solid var(--color-border-default)",
              borderRadius: 8,
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-surface-hover)";
              e.currentTarget.style.borderColor = "var(--color-border-strong)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "var(--color-border-default)";
            }}
          >
            Use a different email
          </button>
        </div>
      </AuthCard>

      <BackToSignIn />
    </div>
  );
}