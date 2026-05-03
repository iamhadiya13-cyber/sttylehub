import { getServerSession } from "next-auth";
import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";
import {
  getSellerApplicationStatus,
  submitSellerApplication,
} from "@/lib/services/seller.service";
import { User } from "@/lib/models/User";
import { sellerApplicationSchema } from "@/lib/validators";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return apiSuccess({
      status: "not_logged_in",
    });
  }

  try {
    await connectDB();
    const data = await getSellerApplicationStatus(session.user.id);
    return apiSuccess(data);
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to fetch seller application status");
  }
}

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit({
      request: req,
      prefix: "seller:apply",
      limit: 3,
      windowMs: 15 * 60 * 1000,
      message: "Too many seller application attempts. Please wait before trying again.",
    });
    if (limited) {
      return limited;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      logSecurityEvent("seller.apply.denied_unauthenticated", {
        path: new URL(req.url).pathname,
      });
      return apiErrorFromUnknown(new Error("Please login first"), "Please login first", 401);
    }

    await connectDB();
    const currentUser = await User.findById(session.user.id).select("email isVerified");
    if (!currentUser) {
      return apiErrorFromUnknown(new Error("Account not found"), "Account not found", 404);
    }
    if (!currentUser.isVerified) {
      logSecurityEvent("seller.apply.denied_unverified", {
        userId: session.user.id,
        email: currentUser.email,
      });
      return Response.json(
        {
          success: false,
          message: "Verify your email to continue",
          code: "EMAIL_VERIFICATION_REQUIRED",
          verificationRequired: true,
        },
        { status: 403 },
      );
    }

    const body = sellerApplicationSchema.parse(await req.json());

    const { message } = await submitSellerApplication(session.user.id, {
      shopName: body.shopName.trim(),
      description: body.description.trim(),
      shopCategory: body.shopCategory.trim(),
      phone: body.phone,
      gstNumber: body.gstNumber.trim(),
      businessType: body.businessType,
      panNumber: body.panNumber.trim(),
      bankDetails: {
        accountName: body.bankDetails.accountName.trim(),
        bankName: body.bankDetails.bankName.trim(),
        accountNumber: body.bankDetails.accountNumber.trim(),
        ifscCode: body.bankDetails.ifscCode.trim().toUpperCase(),
      },
    });

    logSecurityEvent("seller.apply.submitted", {
      userId: session.user.id,
      email: currentUser.email,
      shopName: body.shopName.trim(),
    }, "info");

    return apiSuccess(undefined, message);
  } catch (error) {
    console.error("Seller apply error:", error);
    return apiErrorFromUnknown(error, "Application failed");
  }
}
