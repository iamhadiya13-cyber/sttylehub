import { apiSuccess } from "@/lib/api";
import { withAuth } from "@/lib/api-helpers";
import cloudinary from "@/lib/cloudinary";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const POST = withAuth(async (request) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ success: false, message: "File is required" }, { status: 400 });
    }
    if (!allowedTypes.has(file.type)) {
      return Response.json({ success: false, message: "Unsupported file type" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ success: false, message: "File too large" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "stylehub/avatars",
      transformation: [{ width: 200, height: 200, crop: "fill", radius: "max" }],
    });

    return apiSuccess({ url: result.secure_url, publicId: result.public_id }, "Avatar uploaded successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload avatar";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
