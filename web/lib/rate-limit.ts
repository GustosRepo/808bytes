import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  consumeApiRateLimit,
  hasCommerceDatabaseConfig,
  type ApiRateLimitResult,
} from "@/lib/commerce";

type RateLimitInput = {
  scope: string;
  limit: number;
  windowSeconds: number;
  request?: Request;
  headers?: Headers;
  identifier?: string;
};

type MemoryEntry = {
  count: number;
  windowStart: number;
};

const memoryLimits = new Map<string, MemoryEntry>();

const getHeader = (headers: Headers | undefined, key: string) => headers?.get(key) ?? null;

const getClientIp = (headers: Headers | undefined) => {
  const forwardedFor = getHeader(headers, "x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    getHeader(headers, "x-real-ip") ??
    getHeader(headers, "cf-connecting-ip") ??
    getHeader(headers, "x-vercel-forwarded-for") ??
    "unknown"
  );
};

const getRequestHeaders = (input: RateLimitInput) => input.headers ?? input.request?.headers;

const hashRateLimitKey = (scope: string, identifier: string) => {
  const secret = process.env.RATE_LIMIT_SECRET ?? process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY ?? "808bytes";
  return createHash("sha256").update(`${secret}:${scope}:${identifier}`).digest("hex");
};

const getMemoryRateLimit = (params: {
  keyHash: string;
  scope: string;
  limit: number;
  windowSeconds: number;
}): ApiRateLimitResult => {
  const key = `${params.scope}:${params.keyHash}`;
  const now = Date.now();
  const current = memoryLimits.get(key);
  const windowMs = params.windowSeconds * 1000;
  const entry =
    current && current.windowStart + windowMs > now
      ? { ...current, count: current.count + 1 }
      : { count: 1, windowStart: now };

  memoryLimits.set(key, entry);

  return {
    allowed: entry.count <= params.limit,
    limit: params.limit,
    remaining: Math.max(0, params.limit - entry.count),
    resetAt: new Date(entry.windowStart + windowMs).toISOString(),
  };
};

const rateLimitHeaders = (result: ApiRateLimitResult) => ({
  "Cache-Control": "no-store",
  "RateLimit-Limit": String(result.limit),
  "RateLimit-Remaining": String(result.remaining),
  "RateLimit-Reset": String(Math.ceil(new Date(result.resetAt).getTime() / 1000)),
});

export const getRateLimitStatus = async (input: RateLimitInput): Promise<ApiRateLimitResult | null> => {
  const requestHeaders = getRequestHeaders(input);
  const identity = input.identifier ?? getClientIp(requestHeaders);
  const keyHash = hashRateLimitKey(input.scope, identity);

  if (hasCommerceDatabaseConfig()) {
    try {
      return await consumeApiRateLimit({
        keyHash,
        scope: input.scope,
        limit: input.limit,
        windowSeconds: input.windowSeconds,
      });
    } catch (error) {
      console.error("Rate limit check failed.", {
        scope: input.scope,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  return getMemoryRateLimit({
    keyHash,
    scope: input.scope,
    limit: input.limit,
    windowSeconds: input.windowSeconds,
  });
};

export const checkRateLimit = async (input: RateLimitInput) => {
  const result = await getRateLimitStatus(input);

  if (!result) {
    return NextResponse.json(
      { error: "Request protection is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (result.allowed) {
    return null;
  }

  return NextResponse.json(
    { error: "Too many requests. Try again later." },
    {
      status: 429,
      headers: {
        ...rateLimitHeaders(result),
        "Retry-After": String(
          Math.max(1, Math.ceil((new Date(result.resetAt).getTime() - Date.now()) / 1000)),
        ),
      },
    },
  );
};
