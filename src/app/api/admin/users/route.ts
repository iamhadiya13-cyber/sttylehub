import { z } from "zod";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { adminDeleteUserSchema } from "@/lib/validators";

const updateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "seller", "admin"]).optional(),
  isBanned: z.boolean().optional(),
});

export const GET = withAdmin(async (request) => {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 20);
    const [users, total] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-password"),
      User.countDocuments(),
    ]);
    const totalPages = Math.ceil(total / limit);
    return apiSuccess({
      users,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch users";
    return Response.json({ success: false, message }, { status: 500 });
  }
});

export const PUT = withAdmin(async (request) => {
  try {
    const payload = updateSchema.parse(await request.json());
    await connectDB();
    const update: Record<string, unknown> = {};
    if (payload.role) update.role = payload.role;
    if (typeof payload.isBanned === "boolean") update.isBanned = payload.isBanned;
    const user = await User.findByIdAndUpdate(payload.userId, update, { new: true }).select("-password");
    return apiSuccess(user, "User updated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return Response.json({ success: false, message }, { status: 400 });
  }
});

export const DELETE = withAdmin(async (request) => {
  try {
    const { userId } = adminDeleteUserSchema.parse(await request.json());
    await connectDB();
    await User.findByIdAndDelete(userId);
    return apiSuccess(null, "User deleted successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
