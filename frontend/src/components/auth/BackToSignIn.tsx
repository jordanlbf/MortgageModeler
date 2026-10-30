import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function BackToSignIn() {
  return (
    <Button
      asChild
      variant="link-back"
      className="animate-fade-up mt-6 text-[13px]"
      style={{ animationDelay: "200ms" }}
    >
      <Link href="/login">
        <span aria-hidden="true">←</span>
        Back to sign in
      </Link>
    </Button>
  );
}
