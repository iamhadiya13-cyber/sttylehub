import mongoose from "mongoose";
import slugify from "slugify";
import { sendEmail } from "@/lib/email";
import {
  applicationReceivedEmail,
  vendorApplicationEmail,
  vendorApprovalEmail,
  vendorRejectionEmail,
} from "@/lib/emails/templates";
import { Seller } from "@/lib/models/Seller";
import { User } from "@/lib/models/User";
import {
  createNotification,
  markSellerApplicationNotificationsRead,
} from "@/lib/services/notification.service";
import { createAuditLog } from "@/lib/services/audit-log.service";
import { ServiceError } from "@/lib/services/service-error";

type SellerApplicationInput = {
  shopName: string;
  description: string;
  shopCategory: string;
  phone: string;
  gstNumber?: string;
  businessType?: string;
  panNumber?: string;
  bankDetails: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
};

type SellerWorkflowOptions = {
  notify?: boolean;
};

export async function generateUniqueSellerSlug(name: string) {
  const base = slugify(name, { lower: true, strict: true }) || "seller-shop";
  let slug = base;
  let count = 1;

  while (await Seller.findOne({ shopSlug: slug }).select("_id")) {
    slug = `${base}-${count}`;
    count += 1;
  }

  return slug;
}

export async function getSellerApplicationStatus(userId: string) {
  const seller = await Seller.findOne({ user: userId }).select(
    "isApproved isActive rejectedAt rejectionReason appliedAt approvedAt shopName shopSlug",
  );

  if (!seller) {
    return { status: "none" as const };
  }

  return {
    status: seller.isApproved ? "approved" as const : seller.rejectedAt ? "rejected" as const : "pending" as const,
    seller,
  };
}

async function notifyAdminAndApplicant(input: {
  userName: string;
  userEmail: string;
  shopName: string;
  shopCategory: string;
  description: string;
  phone: string;
  businessType: string;
  gstNumber?: string;
  sellerId: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `🏪 New Vendor Application — ${input.shopName}`,
      html: vendorApplicationEmail({
        applicantName: input.userName,
        applicantEmail: input.userEmail,
        shopName: input.shopName,
        shopCategory: input.shopCategory,
        description: input.description,
        phone: input.phone,
        businessType: input.businessType,
        gstNumber: input.gstNumber,
        appliedAt: new Date().toLocaleString("en-IN"),
        reviewLink: `${appUrl}/admin/sellers`,
      }),
    });
  }

  await sendEmail({
    to: input.userEmail,
    subject: "Application received — StyleHub",
    html: applicationReceivedEmail({
      name: input.userName,
      shopName: input.shopName,
    }),
  });

  await createNotification({
    type: "new_seller_application",
    title: "New Vendor Application",
    message: `${input.userName} applied to open "${input.shopName}"`,
    link: "/admin/sellers",
    relatedId: input.sellerId,
    relatedModel: "Seller",
    applicantName: input.userName,
    shopName: input.shopName,
  });
}

export async function submitSellerApplication(
  userId: string,
  body: SellerApplicationInput,
  options?: SellerWorkflowOptions,
) {
  const user = await User.findById(userId).select("name email");
  if (!user?.email) {
    throw new ServiceError("User account not found", 404);
  }

  const existing = await Seller.findOne({ user: userId });
  if (existing) {
    if (existing.isApproved) {
      throw new ServiceError("You are already an approved seller", 409);
    }
    if (!existing.rejectedAt) {
      throw new ServiceError("You already have a pending application", 409);
    }

    existing.shopName = body.shopName.trim();
    existing.description = body.description.trim();
    existing.shopCategory = body.shopCategory.trim();
    existing.phone = body.phone;
    existing.gstNumber = body.gstNumber?.trim() || "";
    existing.businessType = body.businessType || "individual";
    existing.panNumber = body.panNumber?.trim() || "";
    existing.bankDetails = {
      accountName: body.bankDetails.accountName.trim(),
      bankName: body.bankDetails.bankName.trim(),
      accountNumber: body.bankDetails.accountNumber.trim(),
      ifscCode: body.bankDetails.ifscCode.trim().toUpperCase(),
    };
    existing.isApproved = false;
    existing.isActive = false;
    existing.rejectedAt = undefined;
    existing.rejectionReason = undefined;
    existing.approvedAt = undefined;
    existing.approvedBy = undefined;
    existing.appliedAt = new Date();
    if (!existing.shopSlug) {
      existing.shopSlug = await generateUniqueSellerSlug(body.shopName.trim());
    }
    await existing.save();

    if (options?.notify !== false) {
      await notifyAdminAndApplicant({
        userName: user.name,
        userEmail: user.email,
        shopName: existing.shopName,
        shopCategory: existing.shopCategory,
        description: existing.description,
        phone: existing.phone,
        businessType: existing.businessType,
        gstNumber: existing.gstNumber,
        sellerId: String(existing._id),
      });
    }

    return { seller: existing, message: "Reapplication submitted!" };
  }

  const shopSlug = await generateUniqueSellerSlug(body.shopName.trim());
  const seller = await Seller.create({
    user: userId,
    shopName: body.shopName.trim(),
    shopSlug,
    description: body.description?.trim() || "",
    shopCategory: body.shopCategory || "",
    phone: body.phone || "",
    gstNumber: body.gstNumber || "",
    businessType: body.businessType || "individual",
    panNumber: body.panNumber || "",
    bankDetails: body.bankDetails || {},
    isApproved: false,
    isActive: false,
    appliedAt: new Date(),
  });

  if (options?.notify !== false) {
    await notifyAdminAndApplicant({
      userName: user.name,
      userEmail: user.email,
      shopName: seller.shopName,
      shopCategory: seller.shopCategory,
      description: seller.description,
      phone: seller.phone,
      businessType: seller.businessType,
      gstNumber: seller.gstNumber,
      sellerId: String(seller._id),
    });
  }

  return { seller, message: "Application submitted successfully!" };
}

export async function approveSellerApplication(
  sellerId: string,
  adminUserId: string,
  options?: SellerWorkflowOptions,
) {
  const seller = await Seller.findById(sellerId).populate("user", "name email");
  if (!seller) {
    throw new ServiceError("Seller application not found", 404);
  }

  seller.isApproved = true;
  seller.isActive = true;
  seller.approvedAt = new Date();
  seller.approvedBy = new mongoose.Types.ObjectId(adminUserId);
  seller.rejectedAt = undefined;
  seller.rejectionReason = "";
  await seller.save();

  const sellerUser = seller.user as { _id: mongoose.Types.ObjectId; name: string; email: string };
  await User.findByIdAndUpdate(sellerUser._id, { $set: { role: "seller" } });
  await createAuditLog({
    actorId: adminUserId,
    actorRole: "admin",
    action: "seller_approved",
    entityType: "Seller",
    entityId: String(seller._id),
    summary: `Approved seller application for ${seller.shopName}`,
    metadata: {
      shopName: seller.shopName,
      userId: String(sellerUser._id),
      userEmail: sellerUser.email,
    },
  });

  if (options?.notify !== false) {
    await markSellerApplicationNotificationsRead(seller._id);

    try {
      await sendEmail({
        to: sellerUser.email,
        subject: "🎉 Your vendor application approved!",
        html: vendorApprovalEmail({
          name: sellerUser.name,
          shopName: seller.shopName,
          shopSlug: seller.shopSlug,
          dashboardLink: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/seller/dashboard`,
        }),
      });
    } catch (emailError) {
      console.error("Approval email failed:", emailError);
    }

    await createNotification({
      type: "seller_application_approved",
      title: "Seller account approved",
      message: `${seller.shopName} has been approved. You can start selling now.`,
      link: "/seller/dashboard",
      recipientUserId: sellerUser._id,
      sellerId: seller._id,
      relatedId: seller._id,
      relatedModel: "Seller",
      applicantName: sellerUser.name,
      shopName: seller.shopName,
      isRead: true,
    });
  }

  return { seller, message: `${seller.shopName} approved!` };
}

export async function rejectSellerApplication(
  sellerId: string,
  reason: string,
  adminUserId?: string,
  options?: SellerWorkflowOptions,
) {
  const seller = await Seller.findById(sellerId).populate("user", "name email");
  if (!seller) {
    throw new ServiceError("Seller application not found", 404);
  }

  seller.isApproved = false;
  seller.isActive = false;
  seller.rejectedAt = new Date();
  seller.rejectionReason = reason.trim();
  seller.approvedAt = undefined;
  seller.approvedBy = undefined;
  await seller.save();

  const sellerUser = seller.user as { _id: string; name: string; email: string };
  await User.findByIdAndUpdate(sellerUser._id, { $set: { role: "user" } });
  if (adminUserId) {
    await createAuditLog({
      actorId: adminUserId,
      actorRole: "admin",
      action: "seller_rejected",
      entityType: "Seller",
      entityId: String(seller._id),
      summary: `Rejected seller application for ${seller.shopName}`,
      metadata: {
        shopName: seller.shopName,
        userId: String(sellerUser._id),
        userEmail: sellerUser.email,
        reason: reason.trim(),
      },
    });
  }

  if (options?.notify !== false) {
    await markSellerApplicationNotificationsRead(seller._id);

    try {
      await sendEmail({
        to: sellerUser.email,
        subject: "Update on your StyleHub application",
        html: vendorRejectionEmail({
          name: sellerUser.name,
          shopName: seller.shopName,
          reason: reason.trim(),
          reapplyLink: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/sell-on-stylehub`,
        }),
      });
    } catch (emailError) {
      console.error("Rejection email failed:", emailError);
    }

    await createNotification({
      type: "seller_application_rejected",
      title: "Seller account rejected",
      message: `${seller.shopName} was rejected. Review the feedback and reapply.`,
      link: "/sell-on-stylehub",
      recipientUserId: sellerUser._id,
      sellerId: seller._id,
      relatedId: seller._id,
      relatedModel: "Seller",
      applicantName: sellerUser.name,
      shopName: seller.shopName,
    });
  }

  return { seller, message: "Application rejected" };
}
