import bcrypt from "bcryptjs";
import { z } from "zod";
import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit({
      request,
      prefix: "auth:login",
      limit: 10,
      windowMs: 10 * 60 * 1000,
      message: "Too many login attempts. Please wait and try again.",
    });
    if (limited) {
      return limited;
    }

    const payload = schema.parse(await request.json());
    await connectDB();
    const user = await User.findOne({ email: payload.email.toLowerCase() }).select("+password");

    if (!user) {
      logSecurityEvent("auth.login.failed_user_missing", { email: payload.email.toLowerCase() });
      return Response.json({ success: false, message: "Invalid email or password" }, { status: 401 });
    }
    if (user.isBanned) {
      logSecurityEvent("auth.login.denied_banned", { userId: user.id, email: user.email });
      return Response.json({ success: false, message: "Account unavailable" }, { status: 403 });
    }
    const valid = await bcrypt.compare(payload.password, user.password);
    if (!valid) {
      logSecurityEvent("auth.login.failed_password", { userId: user.id, email: user.email });
      return Response.json({ success: false, message: "Invalid email or password" }, { status: 401 });
    }

    return apiSuccess(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
      "Use NextAuth credentials signIn on the client to establish session",
    );
  } catch (error) {
    return apiErrorFromUnknown(error, "Login failed", 400);
  }
}
