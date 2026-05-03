import { apiSuccess } from "@/lib/api";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { getOtpCooldownRemaining } from "@/lib/otp";
import { userProfileSchema } from "@/lib/validators";

const allowedColorways = new Set(["void", "infrared", "arctic"]);

export const GET = withAuth(async (_request, { user }) => {
  try {
    await connectDB();
    const profile = await User.findById(user.id).select("+emailOtpSentAt");
    if (!profile) {
      return Response.json({ success: false, message: "Profile not found" }, { status: 404 });
    }

    let verificationResendCooldown = 0;
    if (!profile.isVerified && profile.email) {
      const redisCooldown = await getOtpCooldownRemaining("verify-email", profile.email);
      const sentAtCooldown =
        profile.emailOtpSentAt
          ? Math.max(
              0,
              60 - Math.floor((Date.now() - new Date(profile.emailOtpSentAt).getTime()) / 1000),
            )
          : 0;
      verificationResendCooldown = Math.max(redisCooldown, sentAtCooldown);
    }

    const safeProfile = profile.toObject() as Record<string, unknown>;
    delete safeProfile.emailOtpSentAt;
    return apiSuccess({
      ...safeProfile,
      verificationResendCooldown,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile";
    return Response.json({ success: false, message }, { status: 500 });
  }
});

export const PUT = withAuth(async (request, { user }) => {
  try {
    const payload = userProfileSchema.parse(await request.json());
    await connectDB();

    const profile = await User.findByIdAndUpdate(user.id, payload, {
      new: true,
      runValidators: true,
    }).select("-password -resetPasswordOTP -resetPasswordExpiry -emailVerifyToken -emailVerifyExpiry -emailOtp -emailOtpExpiry -emailOtpSentAt");

    return apiSuccess(profile, "Profile updated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return Response.json({ success: false, message }, { status: 400 });
  }
});

export const PATCH = withAuth(async (request, { user }) => {
  try {
    const payload = (await request.json()) as { colorway?: unknown };
    const colorway = typeof payload.colorway === "string" ? payload.colorway : "";

    if (!allowedColorways.has(colorway)) {
      return Response.json(
        { success: false, message: "Invalid colorway selection" },
        { status: 400 },
      );
    }

    await connectDB();

    const profile = await User.findByIdAndUpdate(
      user.id,
      { colorway },
      {
        new: true,
        runValidators: true,
      },
    ).select(
      "-password -resetPasswordOTP -resetPasswordExpiry -emailVerifyToken -emailVerifyExpiry -emailOtp -emailOtpExpiry -emailOtpSentAt",
    );

    return apiSuccess(profile, "Colorway updated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update colorway";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
