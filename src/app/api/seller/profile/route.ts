import { z } from "zod";
import { apiSuccess } from "@/lib/api";
import { withSeller } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Seller } from "@/lib/models/Seller";

const sellerProfileSchema = z.object({
  shopName: z.string().trim().min(1),
  description: z.string().trim().default(""),
  shopCategory: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  shopLogo: z.string().trim().default(""),
  shopBanner: z.string().trim().default(""),
  bankDetails: z.object({
    accountName: z.string().trim().default(""),
    bankName: z.string().trim().default(""),
    accountNumber: z.string().trim().default(""),
    ifscCode: z.string().trim().default(""),
  }),
});

export const GET = withSeller(async (_request, { user }) => {
  try {
    await connectDB();
    const seller = await Seller.findOne({ user: user.id })
      .select("shopName shopSlug shopLogo shopBanner description shopCategory phone businessType panNumber gstNumber bankDetails isApproved isActive appliedAt approvedAt rejectedAt rejectionReason totalEarnings pendingPayout")
      .lean();

    if (!seller) {
      return Response.json({ success: false, message: "Seller profile not found" }, { status: 404 });
    }

    return apiSuccess(seller);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch seller profile";
    return Response.json({ success: false, message }, { status: 500 });
  }
});

export const PUT = withSeller(async (request, { user }) => {
  try {
    const body = sellerProfileSchema.parse(await request.json());
    await connectDB();

    const seller = await Seller.findOneAndUpdate(
      { user: user.id },
      {
        $set: {
          shopName: body.shopName,
          description: body.description,
          shopCategory: body.shopCategory,
          phone: body.phone,
          shopLogo: body.shopLogo,
          shopBanner: body.shopBanner,
          bankDetails: body.bankDetails,
        },
      },
      { new: true },
    )
      .select("shopName shopSlug shopLogo shopBanner description shopCategory phone businessType panNumber gstNumber bankDetails isApproved isActive appliedAt approvedAt rejectedAt rejectionReason totalEarnings pendingPayout")
      .lean();

    if (!seller) {
      return Response.json({ success: false, message: "Seller profile not found" }, { status: 404 });
    }

    return apiSuccess(seller, "Profile updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update seller profile";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
