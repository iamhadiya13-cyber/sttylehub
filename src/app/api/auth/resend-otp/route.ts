import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { apiError, apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { verificationOtpEmail } from "@/lib/emails/templates";
import { User } from "@/lib/models/User";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";
import { generateOtp, getOtpCooldownRemaining, issueOtp, otpConfig } from "@/lib/otp";
import { resendOtpSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit({
      request,
      prefix: "auth:resend-otp",
      limit: 5,
      windowMs: 5 * 60 * 1000,
      message: "Too many resend requests. Please wait a few minutes.",
    });
    if (limited) {
      return limited;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return apiError("Unauthorized", 401);
    }

    const payload = resendOtpSchema.parse(await request.json());
    await connectDB();
    const email = payload.email.toLowerCase();
    if (email !== session.user.email.toLowerCase()) {
      return apiError("Unauthorized", 401);
    }

    const user = await User.findById(session.user.id).select("email isVerified +emailOtpSentAt");
    if (!user) {
      logSecurityEvent("auth.resend_otp.user_missing", { email });
      return apiError("Account not found", 404);
    }
    if (user.email.toLowerCase() !== email) {
      return apiError("Unauthorized", 401);
    }
    if (user.isVerified) {
      return apiError("Email already verified", 400);
    }

    const cooldownRemaining = await getOtpCooldownRemaining("verify-email", email);
    const isDbCooldownActive = user.emailOtpSentAt && Date.now() - new Date(user.emailOtpSentAt).getTime() < 60_000;
    if (cooldownRemaining > 0 || isDbCooldownActive) {
      const retryAfterSeconds = Math.max(
        cooldownRemaining,
        isDbCooldownActive
          ? Math.max(1, 60 - Math.floor((Date.now() - new Date(user.emailOtpSentAt).getTime()) / 1000))
          : 0,
      );
      logSecurityEvent("auth.resend_otp.cooldown_active", { email, retryAfterSeconds });
      return apiError("Please wait before requesting another code", 429, {
        code: "OTP_COOLDOWN",
        retryAfterSeconds,
      });
    }

    const otp = generateOtp();
    user.emailOtp = await bcrypt.hash(otp, 10);
    user.emailOtpExpiry = new Date(Date.now() + otpConfig.expirySeconds * 1000);
    user.emailOtpSentAt = new Date();
    await user.save();
    await issueOtp("verify-email", email, otp);

    await sendEmail({
      to: user.email,
      subject: "Your StyleHub verification code",
      html: verificationOtpEmail(user.name, otp),
    });

    logSecurityEvent("auth.resend_otp.sent", { userId: user.id, email }, "info");
    return apiSuccess({ cooldownSeconds: otpConfig.resendCooldownSeconds }, "Verification code resent");
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to resend OTP", 400);
  }
}
