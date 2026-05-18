/* eslint-disable import/no-default-export */
// Required: Next.js App Router catch-all route must use named exports per HTTP method.
// This file proxies all /api/admin/* requests to the NestJS backend at HERALD_BACKEND_URL.
// The Authorization: Bearer header is added server-side from the NextAuth JWT — never exposed to the browser.

import { getToken } from "next-auth/jwt";

import type { NextRequest } from "next/server";

const BACKEND_URL =
  process.env.HERALD_BACKEND_URL ?? "http://localhost:3001/v1";

async function proxy(
  req: NextRequest,
  params: Promise<{ path: string[] }>,
): Promise<Response> {
  // Use getToken() to read the JWT directly from the request object — avoids
  // Next.js AsyncLocalStorage concurrency issues that cause intermittent null sessions.
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (token.error === "RefreshTokenError" || !token.backend_token) {
    return Response.json(
      { error: "Session expired — please log in again" },
      { status: 401 },
    );
  }

  const { path } = await params;
  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/admin/${path.join("/")}${search}`;

  const headers = new Headers();
  headers.set("content-type", "application/json");
  headers.set("authorization", `Bearer ${token.backend_token as string}`);

  const isBodyMethod =
    req.method === "POST" || req.method === "PUT" || req.method === "PATCH";
  const body = isBodyMethod ? await req.text() : undefined;

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      ...(body !== undefined ? { body } : {}),
    });
  } catch {
    return Response.json({ error: "Backend unavailable" }, { status: 503 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const responseHeaders = new Headers();
  responseHeaders.set("content-type", contentType);

  // Pass through Content-Disposition so CSV exports trigger a download
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) responseHeaders.set("content-disposition", disposition);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, params);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, params);
}
