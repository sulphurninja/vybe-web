import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowed = [
  "http://localhost:3000",         // web
  "http://localhost:19006",        // Expo web dev
  "http://localhost:8081",         // Metro
  "exp://", "http://127.0.0.1:19000"
];

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api")) return;
  const origin = req.headers.get("origin") || "";
  const res = NextResponse.next();
  if (allowed.some(a => origin.startsWith(a))) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    res.headers.set("Access-Control-Allow-Origin", "*"); // loosen for MVP
  }
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export const config = { matcher: ["/api/:path*"] };
