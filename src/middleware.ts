import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (token?.isBanned) {
    return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
    }
  }

  if (pathname.startsWith("/seller")) {
    if (!token) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
    }
  }

  const userProtected = ["/checkout", "/orders", "/profile", "/wishlist"];
  if (userProtected.some((path) => pathname.startsWith(path)) && !token) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*", "/checkout/:path*", "/orders/:path*", "/profile/:path*", "/wishlist/:path*"],
};
