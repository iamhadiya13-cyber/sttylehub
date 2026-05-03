import { apiSuccess } from "@/lib/api";
import { withAuth } from "@/lib/api-helpers";
import cloudinary from "@/lib/cloudinary";

export const DELETE = withAuth(async (_request, { params }) => {
  try {
    await cloudinary.uploader.destroy(params.publicId);
    return apiSuccess(null, "Asset deleted successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete asset";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
