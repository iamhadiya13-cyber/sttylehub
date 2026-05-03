import bcrypt from "bcryptjs";
import { apiError, apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { clearOtpState, verifyOtp } from "@/lib/otp";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";
import { resetPasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit({
      request,
      prefix: "auth:reset-password",
      limit: 10,
      windowMs: 10 * 60 * 1000,
      message: "Too many reset attempts. Please wait and try again.",
    });
    if (limited) {
      return limited;
    }

    const payload = resetPasswordSchema.parse(await request.json());
    await connectDB();
    const email = payload.email.toLowerCase();

    const user = await User.findOne({
      email,
      resetPasswordExpiry: { $gt: new Date() },
    }).select("+password +resetPasswordOTP +resetPasswordExpiry");

    if (!user) {
      logSecurityEvent("auth.reset_password.user_missing_or_expired", { email });
      return apiError("Invalid or expired OTP", 400);
    }

    const redisResult = await verifyOtp("reset-password", email, payload.otp);
    if (!redisResult.ok) {
      logSecurityEvent("auth.reset_password.failed", { userId: user.id, email });
      if (!user.resetPasswordOTP) {
        return apiError(redisResult.message, 400);
      }

      const validOtp = await bcrypt.compare(payload.otp, user.resetPasswordOTP);
      if (!validOtp) {
        return apiError(redisResult.message, 400);
      }
    }

    user.password = await bcrypt.hash(payload.newPassword, 12);
    user.resetPasswordOTP = null;
    user.resetPasswordExpiry = null;
    await user.save();
    await clearOtpState("reset-password", email);
    logSecurityEvent("auth.reset_password.succeeded", { userId: user.id, email }, "info");

    return apiSuccess(null, "Password updated. Please login.");
  } catch (error) {
    return apiErrorFromUnknown(error, "Unable to reset password", 400);
  }
}
