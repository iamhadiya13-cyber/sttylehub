import { v2 as cloudinary } from "cloudinary";
import { withVerifiedUser } from "@/lib/api-helpers";
import { enforceRateLimit } from "@/lib/rate-limit";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const POST = withVerifiedUser(async (req) => {
  try {
    const limited = await enforceRateLimit({
      request: req,
      prefix: "upload:image",
      limit: 20,
      windowMs: 60 * 60 * 1000,
      message: "Too many image uploads. Please wait before trying again.",
    });
    if (limited) {
      return limited;
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json({ success: false, message: "No file provided" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ success: false, message: "File too large. Max 5MB" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ success: false, message: "Only JPG, PNG, WEBP allowed" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "stylehub/products",
      transformation: [{ width: 800, height: 1000, crop: "fill", quality: "auto", fetch_format: "auto" }],
    });

    return Response.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload image";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
