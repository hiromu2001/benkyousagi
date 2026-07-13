import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession } from "@/lib/session";

// Next.js 16: middleware.ts は proxy.ts に改名された(機能は同じ)。
// ここでは楽観的チェックのみ行う(cookie の検証のみ、DB は見ない)。
// 参照: node_modules/next/dist/docs/01-app/02-guides/authentication.md

const PUBLIC_ROUTES = ["/login"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  const token = request.cookies.get("session")?.value;
  const session = await decryptSession(token);

  if (!isPublicRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
