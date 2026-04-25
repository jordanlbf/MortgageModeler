"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import AuthShell from "./AuthShell";
import AuthCard from "./AuthCard";
import GoogleButton from "./GoogleButton";
import OrEmailDivider from "./OrEmailDivider";
import PrimaryButton from "./PrimaryButton";
import PasswordStrength from "./PasswordStrength";

export default function SignupView() {
  const router = useRouter();
  const { register, status } = useAuth();
  // Name is collected for UX but not yet persisted: the platform User model
  // doesn't store it. Add a column + DTO field before wiring it in.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await register(email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
      setSubmitting(false);
    }
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

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-[13px] text-red-400/80"
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Full name"
            autoComplete="name"
            aria-label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />
          <input
            type="email"
            className="form-input"
            placeholder="Email"
            autoComplete="email"
            aria-label="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
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
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
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

        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </PrimaryButton>
      </AuthCard>
    </AuthShell>
  );
}
