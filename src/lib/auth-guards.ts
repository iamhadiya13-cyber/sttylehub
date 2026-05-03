import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function requireAuthenticatedUser(callbackUrl: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session;
}

async function getCurrentAuthState(userId: string) {
  await connectDB();
  const user = await User.findById(userId)
    .select("role isVerified isBanned")
    .lean<{ role?: string; isVerified?: boolean; isBanned?: boolean } | null>();

  if (!user || user.isBanned) {
    redirect("/login?error=unauthorized");
  }

  return {
    role: user.role || "user",
    isVerified: Boolean(user.isVerified),
  };
}

export async function requireVerifiedUser(callbackUrl: string) {
  const session = await requireAuthenticatedUser(callbackUrl);
  const authState = await getCurrentAuthState(session.user.id);

  if (!authState.isVerified) {
    redirect("/profile?verification=required");
  }

  return session;
}

export async function requireAdminUser(callbackUrl: string) {
  const session = await requireAuthenticatedUser(callbackUrl);
  const authState = await getCurrentAuthState(session.user.id);

  if (!authState.isVerified) {
    redirect("/profile?verification=required");
  }

  if (authState.role !== "admin") {
    redirect("/");
  }

  return session;
}

export async function requireSellerUser(callbackUrl: string) {
  const session = await requireAuthenticatedUser(callbackUrl);
  const authState = await getCurrentAuthState(session.user.id);

  if (!authState.isVerified) {
    redirect("/profile?verification=required");
  }

  if (authState.role !== "seller" && authState.role !== "admin") {
    redirect("/");
  }

  return session;
}
