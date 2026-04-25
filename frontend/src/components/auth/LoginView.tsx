"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import AuthShell from "./AuthShell";
import AuthCard from "./AuthCard";
import GoogleButton from "./GoogleButton";
import OrEmailDivider from "./OrEmailDivider";
import PrimaryButton from "./PrimaryButton";

export default function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextHref = searchParams.get("next") ?? "/";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(nextHref);
    }
  }, [status, nextHref, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.replace(nextHref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    console.log("login with google");
  };

  return (
    <AuthShell
      heading={
        <>
          <span style={{ color: "var(--color-brand)" }}>Every number</span> behind your property
          decisions.
        </>
      }
      sub="Sign in to your workspace."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            style={{ color: "var(--color-brand)", textDecoration: "none", fontWeight: 500 }}
          >
            Sign up
          </Link>
        </>
      }
    >
      <AuthCard onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <GoogleButton mode="signin" onClick={handleGoogleSignIn} />
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

        <div style={{ marginBottom: 14 }}>
          <label
            htmlFor="login-email"
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
            id="login-email"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 6,
            }}
          >
            <label
              htmlFor="login-password"
              style={{ fontSize: 13, color: "var(--color-fg-secondary)", fontWeight: 400 }}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              style={{
                fontSize: 12,
                color: "var(--color-fg-tertiary)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-fg-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-fg-tertiary)";
              }}
            >
              Forgot?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            className="form-input"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </div>

        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </PrimaryButton>
      </AuthCard>
    </AuthShell>
  );
}
