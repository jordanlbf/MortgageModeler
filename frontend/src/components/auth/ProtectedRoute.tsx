"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: ReactNode;
  /**
   * Rendered while auth status is "loading" or during the redirect to
   * /login. Defaults to null — pass a Skeleton or spinner if a brief blank
   * frame is jarring for the wrapped route.
   */
  fallback?: ReactNode;
}

export default function ProtectedRoute({ children, fallback = null }: Props) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "anonymous") return;
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`/login${next}`);
  }, [status, pathname, router]);

  if (status === "authenticated") return <>{children}</>;
  return <>{fallback}</>;
}
