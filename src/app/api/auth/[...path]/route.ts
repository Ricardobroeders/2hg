import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

/**
 * Auth API proxy. Everything the Better Auth client calls lands here.
 *
 * Google is the only sign-in method we expose. `email_password` is disabled on
 * the Neon side too (2026-08-28), so this guard is now defence in depth rather
 * than the only lock — deliberately kept, because the service-level setting
 * lives outside the repo and a future branch could be provisioned with the
 * default (enabled) without anyone noticing. Password auth would also drag in
 * an email provider, verification and reset flows we've chosen not to run.
 */
const BLOCKED = [
  "sign-up/email",
  "sign-in/email",
  "forget-password",
  "reset-password",
  "change-password",
  "sign-in/email-otp",
  "email-otp/send-verification-otp",
];

const handler = auth.handler();

function blocked(request: NextRequest): boolean {
  const path = new URL(request.url).pathname.replace(/^\/api\/auth\//, "");
  return BLOCKED.some((b) => path === b || path.startsWith(`${b}/`));
}

function refuse() {
  return Response.json(
    { error: "Password sign-in isn't enabled. Use Google." },
    { status: 404 },
  );
}

type Ctx = RouteContext<"/api/auth/[...path]">;

export async function GET(request: NextRequest, ctx: Ctx) {
  if (blocked(request)) return refuse();
  return handler.GET(request, ctx);
}

export async function POST(request: NextRequest, ctx: Ctx) {
  if (blocked(request)) return refuse();
  return handler.POST(request, ctx);
}
