import type { Metadata } from "next";
import LoginView from "@/components/auth/LoginView";

export const metadata: Metadata = {
  title: "Sign in · MortgageModeler",
};

export default function LoginPage() {
  return <LoginView />;
}
 