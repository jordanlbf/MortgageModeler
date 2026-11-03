/**
 * Whether the internal /kitchen-sink route is served.
 *
 * Always on outside production builds (`next dev`, tests). In a production
 * build (`NODE_ENV=production`, which includes Vercel previews) it needs
 * `NEXT_PUBLIC_SHOW_KITCHEN_SINK=true`, so set that in the preview env only.
 */
export function isKitchenSinkEnabled(env: { NODE_ENV?: string; NEXT_PUBLIC_SHOW_KITCHEN_SINK?: string }): boolean {
  if (env.NODE_ENV !== "production") return true;
  return env.NEXT_PUBLIC_SHOW_KITCHEN_SINK === "true";
}
