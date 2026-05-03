import { apiSuccess } from "@/lib/api";
import { withVerifiedUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Cart } from "@/lib/models/Cart";

export const GET = withVerifiedUser(async (_request, { user }) => {
  try {
    await connectDB();
    const cart = await Cart.findOne({ user: user.id }).populate("items.product");
    return apiSuccess(cart?.items ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch cart";
    return Response.json({ success: false, message }, { status: 500 });
  }
});
