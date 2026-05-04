import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (token?.isBanned) {
    return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!token || token.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (pathname.startsWith("/seller")) {
    if (!token || (token.role !== "seller" && token.role !== "admin")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  const userProtected = ["/checkout", "/orders", "/wishlist"];
  if (userProtected.some((path) => pathname.startsWith(path)) && !token) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*", "/checkout/:path*", "/orders/:path*", "/wishlist/:path*"],
};
