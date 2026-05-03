import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { logSecurityEvent } from "@/lib/security-log";

type SessionUser = {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
  avatar?: string;
  isVerified: boolean;
  isBanned: boolean;
};

type HandlerContext<TParams extends Record<string, string> = Record<string, string>> = {
  params: TParams;
  user: SessionUser;
};

type RouteHandler<TParams extends Record<string, string> = Record<string, string>> = (
  request: Request,
  context: HandlerContext<TParams>,
) => Promise<Response>;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function jsonError(message: string, status = 400, extras?: Record<string, unknown>) {
  return NextResponse.json({ success: false, message, ...extras }, { status });
}

async function getAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  await connectDB();
  const currentUser = await User.findById(session.user.id)
    .select("role name email avatar isVerified isBanned")
    .lean<{
      _id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      avatar?: string;
      isVerified?: boolean;
      isBanned?: boolean;
    } | null>();

  if (!currentUser) {
    return null;
  }

  return {
    id: String(currentUser._id),
    role: currentUser.role,
    name: currentUser.name,
    email: currentUser.email,
    avatar: currentUser.avatar,
    isVerified: Boolean(currentUser.isVerified),
    isBanned: Boolean(currentUser.isBanned),
  } satisfies SessionUser;
}

export function withAuth<TParams extends Record<string, string> = Record<string, string>>(handler: RouteHandler<TParams>) {
  return async (request: Request, { params }: { params: TParams }) => {
    const user = await getAuthUser();
    if (!user) {
      return jsonError("Unauthorized", 401);
    }
    if (user.isBanned) {
      logSecurityEvent("auth.banned_access_denied", {
        userId: user.id,
        role: user.role,
        path: new URL(request.url).pathname,
      });
      return jsonError("Account unavailable", 403, { code: "ACCOUNT_UNAVAILABLE" });
    }
    return handler(request, { params, user });
  };
}

export function withVerifiedUser<TParams extends Record<string, string> = Record<string, string>>(handler: RouteHandler<TParams>) {
  return withAuth(async (request, context) => {
    if (!context.user.isVerified) {
      logSecurityEvent("auth.verification_required", {
        userId: context.user.id,
        role: context.user.role,
        path: new URL(request.url).pathname,
      });
      return jsonError("Verify your email to continue", 403, {
        code: "EMAIL_VERIFICATION_REQUIRED",
        verificationRequired: true,
      });
    }
    return handler(request, context as HandlerContext<TParams>);
  });
}

export function withAdmin<TParams extends Record<string, string> = Record<string, string>>(handler: RouteHandler<TParams>) {
  return withAuth(async (request, context) => {
    if (!context.user.isVerified) {
      logSecurityEvent("auth.unverified_admin_denied", {
        userId: context.user.id,
        path: new URL(request.url).pathname,
      });
      return jsonError("Verify your email to continue", 403, {
        code: "EMAIL_VERIFICATION_REQUIRED",
        verificationRequired: true,
      });
    }
    if (context.user.role !== "admin") {
      logSecurityEvent("auth.admin_denied", {
        userId: context.user.id,
        role: context.user.role,
        path: new URL(request.url).pathname,
      });
      return jsonError("Forbidden", 403);
    }
    return handler(request, context as HandlerContext<TParams>);
  });
}

export function withSeller<TParams extends Record<string, string> = Record<string, string>>(handler: RouteHandler<TParams>) {
  return withAuth(async (request, context) => {
    if (!context.user.isVerified) {
      logSecurityEvent("auth.unverified_seller_denied", {
        userId: context.user.id,
        path: new URL(request.url).pathname,
      });
      return jsonError("Verify your email to continue", 403, {
        code: "EMAIL_VERIFICATION_REQUIRED",
        verificationRequired: true,
      });
    }
    if (!["seller", "admin"].includes(context.user.role)) {
      logSecurityEvent("auth.seller_denied", {
        userId: context.user.id,
        role: context.user.role,
        path: new URL(request.url).pathname,
      });
      return jsonError("Forbidden", 403);
    }
    return handler(request, context as HandlerContext<TParams>);
  });
}

export function withRateLimit<TParams extends Record<string, string> = Record<string, string>>(
  handler: (request: Request, context: { params: TParams }) => Promise<Response>,
  limit: number,
  windowMs: number,
) {
  return async (request: Request, context: { params: TParams }) => {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "anonymous";
    const now = Date.now();
    const current = rateLimitStore.get(ip);

    if (!current || current.resetAt <= now) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return handler(request, context);
    }

    if (current.count >= limit) {
      return jsonError("Too many requests", 429);
    }

    current.count += 1;
    rateLimitStore.set(ip, current);
    return handler(request, context);
  };
}
