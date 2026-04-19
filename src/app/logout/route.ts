import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function GET(req: Request) {
  await destroySession();
  const url = new URL(req.url);
  return NextResponse.redirect(new URL("/login", url.origin));
}

export async function POST(req: Request) {
  await destroySession();
  const url = new URL(req.url);
  return NextResponse.redirect(new URL("/login", url.origin), { status: 303 });
}
