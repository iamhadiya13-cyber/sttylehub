import bcrypt from "bcryptjs";
import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { forgotPasswordEmail } from "@/lib/emails/templates";
import { User } from "@/lib/models/User";
import { enforceRateLimit } from "@/lib/rate-limit";
import { generateOtp, issueOtp, otpConfig } from "@/lib/otp";
import { logSecurityEvent } from "@/lib/security-log";
import { forgotPasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit({
      request,
      prefix: "auth:forgot-password",
      limit: 5,
      windowMs: 10 * 60 * 1000,
      message: "Too many password reset requests. Please wait a few minutes.",
    });
    if (limited) {
      return limited;
    }

    const { email } = forgotPasswordSchema.parse(await request.json());
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).select("+resetPasswordOTP +resetPasswordExpiry");
    if (!user) {
      logSecurityEvent("auth.forgot_password.user_missing", { email: email.toLowerCase() });
      return apiSuccess(null, "OTP sent to your email");
    }

    const otp = generateOtp();
    user.resetPasswordOTP = await bcrypt.hash(otp, 10);
    user.resetPasswordExpiry = new Date(Date.now() + otpConfig.expirySeconds * 1000);
    await user.save();
    await issueOtp("reset-password", user.email, otp);

    await sendEmail({
      to: user.email,
      subject: "Your StyleHub OTP",
      html: forgotPasswordEmail(user.name, otp),
    });

    logSecurityEvent("auth.forgot_password.sent", { userId: user.id, email: user.email }, "info");

    return apiSuccess(null, "OTP sent to your email");
  } catch (error) {
    return apiErrorFromUnknown(error, "Unable to process request", 400);
  }
}
