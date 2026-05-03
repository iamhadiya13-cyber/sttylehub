import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { apiError, apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";
import { clearOtpState, verifyOtp } from "@/lib/otp";
import { verifyOtpSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit({
      request,
      prefix: "auth:verify-otp",
      limit: 10,
      windowMs: 10 * 60 * 1000,
      message: "Too many OTP verification attempts. Please wait and try again.",
    });
    if (limited) {
      return limited;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return apiError("Unauthorized", 401);
    }

    const payload = verifyOtpSchema.parse(await request.json());
    await connectDB();
    const email = payload.email.toLowerCase();
    if (email !== session.user.email.toLowerCase()) {
      return apiError("Unauthorized", 401);
    }

    const user = await User.findById(session.user.id).select("email isVerified +emailOtp +emailOtpExpiry");
    if (!user) {
      logSecurityEvent("auth.verify_otp.user_missing", { email });
      return apiError("Invalid or expired OTP", 400);
    }
    if (user.email.toLowerCase() !== email) {
      return apiError("Unauthorized", 401);
    }
    if (user.isVerified) {
      return apiError("Email already verified", 400);
    }

    const redisResult = await verifyOtp("verify-email", email, payload.otp);
    if (!redisResult.ok) {
      logSecurityEvent("auth.verify_otp.failed", { userId: user.id, email });
      if (!user.emailOtp || !user.emailOtpExpiry || user.emailOtpExpiry < new Date()) {
        return apiError(redisResult.message, 400);
      }

      const validFallback = await bcrypt.compare(payload.otp, user.emailOtp);
      if (!validFallback) {
        return apiError(redisResult.message, 400);
      }
    }

    user.isVerified = true;
    user.emailOtp = null;
    user.emailOtpExpiry = null;
    user.emailOtpSentAt = null;
    await user.save();
    await clearOtpState("verify-email", email);
    logSecurityEvent("auth.verify_otp.succeeded", { userId: user.id, email }, "info");

    return apiSuccess(null, "Email verified successfully");
  } catch (error) {
    return apiErrorFromUnknown(error, "Verification failed", 400);
  }
}
