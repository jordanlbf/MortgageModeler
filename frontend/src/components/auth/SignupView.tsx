"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "./AuthShell";
import AuthCard from "./AuthCard";
import GoogleButton from "./GoogleButton";
import OrEmailDivider from "./OrEmailDivider";
import PrimaryButton from "./PrimaryButton";
import PasswordStrength from "./PasswordStrength";

export default function SignupView() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("signup submit", { name, email, password });
  };

  const handleGoogleSignUp = () => {
    console.log("signup with google");
  };

  return (
    <AuthShell
      heading={
        <>
          Model <span style={{ color: "var(--color-brand)" }}>every number</span> behind your
          property decisions.
        </>
      }
      sub="Create your free workspace to get started."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "var(--color-brand)", textDecoration: "none", fontWeight: 500 }}
          >
            Sign in
          </Link>
        </>
      }
    >
      <AuthCard onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <GoogleButton mode="signup" onClick={handleGoogleSignUp} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <OrEmailDivider text="or email" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Full name"
            autoComplete="name"
            aria-label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            className="form-input"
            placeholder="Email"
            autoComplete="email"
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          <input
            type="password"
            className="form-input"
            placeholder="Password"
            autoComplete="new-password"
            aria-label="Password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordStrength value={password} />
        </div>

        <p
          style={{
            fontSize: 11,
            color: "var(--color-fg-tertiary)",
            lineHeight: 1.5,
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          By creating an account you agree to our{" "}
          <Link
            href="#"
            style={{
              color: "var(--color-fg-secondary)",
              textDecoration: "underline",
              textDecorationColor: "var(--color-border-default)",
              textUnderlineOffset: 2,
            }}
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="#"
            style={{
              color: "var(--color-fg-secondary)",
              textDecoration: "underline",
              textDecorationColor: "var(--color-border-default)",
              textUnderlineOffset: 2,
            }}
          >
            Privacy Policy
          </Link>
          .
        </p>

        <PrimaryButton type="submit">Create account</PrimaryButton>
      </AuthCard>
    </AuthShell>
  );
}