import { NextResponse } from "next/server";

/**
 * Guards debug-only API routes.
 *
 * Returns a 404 response when access should be denied. Access is allowed when:
 *   - NODE_ENV is not "production", OR
 *   - the request carries an `x-debug-secret` header matching `DEBUG_ROUTES_SECRET`.
 *
 * Returning 404 (not 401/403) avoids advertising the existence of these routes.
 */
export function assertDebugAccess(req: Request): NextResponse | null {
  const inProd = process.env.NODE_ENV === "production";
  if (!inProd) return null;

  const expected = process.env.DEBUG_ROUTES_SECRET;
  const provided = req.headers.get("x-debug-secret");
  if (expected && provided && provided === expected) return null;

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
