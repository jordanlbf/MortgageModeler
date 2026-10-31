import { NextResponse } from "next/server";
import { isKitchenSinkEnabled } from "@/lib/kitchen-sink-gate";

/**
 * Next 16 proxy (formerly middleware). Only matched for /kitchen-sink, so it
 * adds nothing to other requests: 404s the internal component gallery in
 * production unless NEXT_PUBLIC_SHOW_KITCHEN_SINK=true.
 */
export function proxy() {
  if (!isKitchenSinkEnabled(process.env)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/kitchen-sink", "/kitchen-sink/:path*"],
};
