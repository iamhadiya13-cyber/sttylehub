import { apiSuccess } from "@/lib/api";
import { withVerifiedUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { addressSchema } from "@/lib/validators";
import { z } from "zod";

const updateAddressSchema = addressSchema.partial().extend({
  isDefault: z.boolean().optional(),
});

export const PUT = withVerifiedUser(async (request, { params, user }) => {
  try {
    const payload = updateAddressSchema.parse(await request.json());
    await connectDB();

    if (payload.isDefault) {
      await User.updateOne({ _id: user.id }, { $set: { "addresses.$[].isDefault": false } });
    }

    const updateFields = Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [`addresses.$.${key}`, value]),
    );

    const updatedUser = await User.findOneAndUpdate({ _id: user.id, "addresses._id": params.id }, { $set: updateFields }, { new: true, runValidators: true }).select("addresses");

    return apiSuccess(updatedUser?.addresses ?? [], "Address updated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update address";
    return Response.json({ success: false, message }, { status: 400 });
  }
});

export const DELETE = withVerifiedUser(async (_request, { params, user }) => {
  try {
    await connectDB();
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $pull: { addresses: { _id: params.id } } },
      { new: true },
    ).select("addresses");

    return apiSuccess(updatedUser?.addresses ?? [], "Address removed successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove address";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
