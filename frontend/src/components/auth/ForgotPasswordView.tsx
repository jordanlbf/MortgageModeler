"use client";

import { useState } from "react";
import AuthShell from "./AuthShell";
import AuthCard from "./AuthCard";
import PrimaryButton from "./PrimaryButton";
import BackToSignIn from "./BackToSignIn";
import ForgotPasswordSent from "./ForgotPasswordSent";

export default function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [hasSent, setHasSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("forgot-password submit", { email });
    setHasSent(true);
  };

  const handleRetry = () => {
    setEmail("");
    setHasSent(false);
  };

  if (hasSent) {
    return <ForgotPasswordSent email={email} onRetry={handleRetry} />;
  }

  return (
    <AuthShell
      heading="Reset your password"
      sub="Enter the email you signed up with and we'll send you a reset link."
      logoSize={36}
      compact
      footer={<BackToSignIn />}
    >
      <AuthCard onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="forgot-email"
            style={{
              display: "block",
              fontSize: 13,
              color: "var(--color-fg-secondary)",
              fontWeight: 400,
              marginBottom: 6,
            }}
          >
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <PrimaryButton type="submit">Send reset link</PrimaryButton>
      </AuthCard>
    </AuthShell>
  );
}