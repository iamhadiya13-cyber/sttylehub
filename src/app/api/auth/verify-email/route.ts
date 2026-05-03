import { apiSuccess } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { enforceRateLimit } from "@/lib/rate-limit";
import { verifyEmailSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit({
      request,
      prefix: "auth:verify-email-link",
      limit: 10,
      windowMs: 10 * 60 * 1000,
      message: "Too many verification attempts. Please wait and try again.",
    });
    if (limited) {
      return limited;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { token } = verifyEmailSchema.parse(await request.json());
    await connectDB();

    const currentUser = await User.findById(session.user.id).select("isVerified");
    if (!currentUser) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (currentUser.isVerified) {
      return Response.json({ success: false, message: "Email already verified" }, { status: 400 });
    }

    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpiry: { $gt: new Date() },
    }).select("+emailVerifyToken +emailVerifyExpiry");

    if (!user) {
      return Response.json({ success: false, message: "Invalid or expired token" }, { status: 400 });
    }

    user.isVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpiry = null;
    await user.save();

    return apiSuccess(null, "Email verified. You can now login.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return Response.json({ success: false, message }, { status: 400 });
  }
}
