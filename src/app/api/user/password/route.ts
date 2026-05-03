import bcrypt from "bcryptjs";
import { z } from "zod";
import { apiSuccess } from "@/lib/api";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

export const PUT = withAuth(async (request, { user }) => {
  try {
    const limited = await enforceRateLimit({
      request,
      prefix: "user:password",
      identifier: user.id,
      limit: 10,
      windowMs: 60 * 60 * 1000,
      message: "Too many password change attempts. Please wait and try again.",
    });
    if (limited) {
      return limited;
    }

    const payload = schema.parse(await request.json());
    await connectDB();

    const currentUser = await User.findById(user.id).select("+password");
    if (!currentUser) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(payload.currentPassword, currentUser.password);
    if (!valid) {
      return Response.json({ success: false, message: "Current password is incorrect" }, { status: 400 });
    }

    currentUser.password = await bcrypt.hash(payload.newPassword, 12);
    await currentUser.save();

    return apiSuccess(null, "Password updated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update password";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
