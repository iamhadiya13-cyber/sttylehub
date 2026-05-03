import { apiSuccess } from "@/lib/api";
import { withVerifiedUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { addressSchema } from "@/lib/validators";

export const GET = withVerifiedUser(async (_request, { user }) => {
  try {
    await connectDB();
    const profile = await User.findById(user.id).select("addresses");
    return apiSuccess(profile?.addresses ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch addresses";
    return Response.json({ success: false, message }, { status: 500 });
  }
});

export const POST = withVerifiedUser(async (request, { user }) => {
  try {
    const payload = addressSchema.parse(await request.json());
    await connectDB();

    if (payload.isDefault) {
      await User.updateOne({ _id: user.id }, { $set: { "addresses.$[].isDefault": false } });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $push: { addresses: payload } },
      { new: true, runValidators: true },
    ).select("addresses");

    return apiSuccess(updatedUser?.addresses ?? [], "Address saved successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save address";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
