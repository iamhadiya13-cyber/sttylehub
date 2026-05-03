import bcrypt from "bcryptjs";
import { apiError, apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { verificationOtpEmail } from "@/lib/emails/templates";
import { User } from "@/lib/models/User";
import { enforceRateLimit } from "@/lib/rate-limit";
import { generateOtp, issueOtp, otpConfig } from "@/lib/otp";
import { logSecurityEvent } from "@/lib/security-log";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit({
      request,
      prefix: "auth:register",
      limit: 5,
      windowMs: 5 * 60 * 1000,
      message: "Too many signup attempts. Please wait a few minutes.",
    });
    if (limited) {
      return limited;
    }

    const payload = registerSchema.parse(await request.json());
    await connectDB();

    const existingUser = await User.findOne({ email: payload.email.toLowerCase() }).select("_id");
    if (existingUser) {
      logSecurityEvent("auth.register.duplicate_email", { email: payload.email.toLowerCase() });
      return apiError("Email already registered", 409);
    }

    const password = await bcrypt.hash(payload.password, 12);
    const otp = generateOtp();
    const emailOtp = await bcrypt.hash(otp, 10);
    const emailOtpExpiry = new Date(Date.now() + otpConfig.expirySeconds * 1000);
    const emailOtpSentAt = new Date();
    const email = payload.email.toLowerCase();

    const user = await User.create({
      name: payload.name,
      email,
      password,
      emailOtp,
      emailOtpExpiry,
      emailOtpSentAt,
    });
    await issueOtp("verify-email", email, otp);

    await sendEmail({
      to: user.email,
      subject: "Your StyleHub verification code",
      html: verificationOtpEmail(user.name, otp),
    });

    logSecurityEvent("auth.register.created", { userId: user.id, email: user.email }, "info");

    return apiSuccess({ email: user.email }, "Verification code sent to your email");
  } catch (error) {
    return apiErrorFromUnknown(error, "Registration failed", 400);
  }
}
