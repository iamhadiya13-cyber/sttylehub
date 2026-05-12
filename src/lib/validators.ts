import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1).optional(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const resendOtpSchema = z.object({
  email: z.string().email(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6).max(6),
  newPassword: z.string().min(8).max(128),
});

export const userProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().min(8).max(20).optional(),
  avatar: z.string().url().optional(),
  dateOfBirth: z.string().optional(),
  genderPreference: z.enum(["men", "women", "unisex"]).optional(),
});

export const addressSchema = z.object({
  label: z.string().min(1).optional().default("Home"),
  fullName: z.string().min(2),
  phone: z.string().min(10).max(15),
  street: z.string().min(3),
  locality: z.string().min(2),
  landmark: z.string().optional().default(""),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().length(6),
  country: z.string().min(2),
  addressType: z.enum(["Home", "Work", "Other"]).default("Home"),
  isDefault: z.boolean().default(false),
});

export const productInputSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  shortDescription: z.string().min(10),
  price: z.number().min(0),
  discountPrice: z.number().min(0),
  images: z.array(z.string().url()).min(1).max(8),
  colorImages: z.record(z.string(), z.array(z.string().url()).max(4)).optional().default({}),
  categoryId: z.string().min(1),
  brand: z.string().min(2),
  gender: z.enum(["men", "women", "unisex"]).default("unisex"),
  variants: z
    .array(
      z.object({
        _id: z.string().optional(),
        size: z.string().min(1),
        color: z.object({
          name: z.string().min(1),
          hex: z.string().min(4),
        }),
        stock: z.number().int().min(0),
        sku: z.string().optional().default(""),
        price: z.number().min(0),
        compareAtPrice: z.number().min(0).nullable().optional(),
        image: z.string().optional().default(""),
        isActive: z.boolean().optional().default(true),
        weight: z.number().min(0).nullable().optional(),
        barcode: z.string().optional().default(""),
      }),
    )
    .min(1),
  acceptedPayments: z
    .object({
      upi: z.boolean().default(true),
      creditCard: z.boolean().default(true),
      cod: z.boolean().default(true),
    })
    .default({ upi: true, creditCard: true, cod: true }),
  returnAllowed: z.boolean().default(false),
  returnWindowDays: z.number().int().min(1).max(30).default(7),
  exchangeAllowed: z.boolean().default(false),
  exchangeWindowDays: z.number().int().min(1).max(30).default(7),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

const paymentMethodSchema = z.enum(["upi", "credit_card", "cod"]);

const upiPaymentDetailsSchema = z.object({
  upiId: z.string().trim().min(1, "UPI ID is required"),
});

const creditCardPaymentDetailsSchema = z.object({
  cardholderName: z.string().trim().min(1, "Cardholder name is required"),
  cardNumber: z.string().trim().min(12).max(19),
  expiryMonth: z.string().trim().regex(/^(0[1-9]|1[0-2])$/, "Use MM format"),
  expiryYear: z.string().trim().regex(/^\d{2,4}$/, "Use YY or YYYY format"),
  cvv: z.string().trim().regex(/^\d{3,4}$/, "Enter a valid CVV"),
});

const paymentDetailsSchema = z
  .object({
    upi: upiPaymentDetailsSchema.optional(),
    creditCard: creditCardPaymentDetailsSchema.optional(),
  })
  .optional();

export const cartSyncSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      variantId: z.string().optional(),
      size: z.string().optional().default(""),
      color: z.string().optional().default(""),
      qty: z.number().int().min(1),
    }),
  ),
});

const orderBaseSchema = z.object({
  idempotencyKey: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      variantId: z.string().optional(),
      qty: z.number().int().min(1),
      size: z.string().optional().default(""),
      color: z.string().optional().default(""),
      clientPrice: z.number().min(0).optional(),
      clientDiscountPrice: z.number().min(0).optional(),
    }),
  ),
  shippingAddressId: z.string().min(1),
  paymentMethod: paymentMethodSchema,
  paymentDetails: paymentDetailsSchema,
  couponCode: z.string().optional(),
  couponId: z.string().optional(),
});

function validatePaymentDetails(value: z.infer<typeof orderBaseSchema>, ctx: z.RefinementCtx) {
    if (value.paymentMethod === "upi" && !value.paymentDetails?.upi?.upiId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentDetails", "upi", "upiId"],
        message: "UPI ID is required",
      });
    }

    if (value.paymentMethod === "credit_card" && !value.paymentDetails?.creditCard) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentDetails", "creditCard"],
        message: "Credit card details are required",
      });
    }

    if (value.paymentMethod === "cod" && value.paymentDetails) {
      const hasUpi = Boolean(value.paymentDetails.upi?.upiId);
      const hasCard =
        Boolean(value.paymentDetails.creditCard?.cardholderName) ||
        Boolean(value.paymentDetails.creditCard?.cardNumber) ||
        Boolean(value.paymentDetails.creditCard?.expiryMonth) ||
        Boolean(value.paymentDetails.creditCard?.expiryYear) ||
        Boolean(value.paymentDetails.creditCard?.cvv);

      if (hasUpi || hasCard) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["paymentDetails"],
          message: "Cash on Delivery does not accept payment details",
        });
      }
    }
}

export const orderCreateSchema = orderBaseSchema.superRefine(validatePaymentDetails);

export const orderValidationSchema = orderBaseSchema
  .extend({
    shippingAddressId: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) =>
    validatePaymentDetails(
      {
        ...value,
        shippingAddressId: value.shippingAddressId || "",
      },
      ctx,
    ),
  );

export const cancelOrderSchema = z.object({
  reason: z.string().min(1).max(500),
  customReason: z.string().max(500).optional(),
});

export const reviewDeleteSchema = z.object({
  reviewId: z.string().min(1),
});

export const adminDeleteUserSchema = z.object({
  userId: z.string().min(1),
});

export const notificationUpdateSchema = z
  .object({
    id: z.string().min(1).optional(),
    markAll: z.boolean().optional(),
  })
  .refine((value) => value.markAll === true || Boolean(value.id), {
    message: "Provide an id or markAll=true",
  });

export const reviewCreateSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(2),
  comment: z.string().min(5),
  images: z.array(z.string().url()).max(5).optional().default([]),
});

export const reviewUpdateSchema = reviewCreateSchema.omit({ productId: true, images: true });

export const returnRequestSchema = z.object({
  type: z.enum(["return", "exchange"]),
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().optional().default(""),
  })).min(1),
  reason: z.enum([
    "Wrong size",
    "Damaged or defective",
    "Not as described",
    "Changed my mind",
    "Wrong item received",
    "Other",
  ]),
  customReason: z.string().trim().optional().default(""),
  evidenceImages: z.array(z.string().url()).max(3).default([]),
  refundMethod: z.object({
    type: z.enum(["bank", "upi"]),
    details: z.object({
      accountHolderName: z.string().trim().optional().default(""),
      bankName: z.string().trim().optional().default(""),
      accountNumber: z.string().trim().optional().default(""),
      ifscCode: z.string().trim().optional().default(""),
      upiId: z.string().trim().optional().default(""),
    }),
  }).optional(),
  exchangeVariantId: z.string().optional(),
});

export const sellerReturnRequestDecisionSchema = z.object({
  status: z.enum(["approved", "rejected", "completed"]),
  sellerNote: z.string().trim().optional().default(""),
});

export const couponValidateSchema = z.object({
  code: z.string().min(1),
  cartTotal: z.number().min(0),
  categoryIds: z.array(z.string()).default([]),
});

export const sellerApplicationSchema = z.object({
  shopName: z.string().trim().min(1),
  description: z.string().trim().min(30),
  shopCategory: z.string().trim().min(1),
  phone: z.string().regex(/^\d{10}$/, "Valid phone number required"),
  gstNumber: z.string().optional().default(""),
  businessType: z.enum(["individual", "sole_prop", "private_ltd", "partnership"]).default("individual"),
  panNumber: z.string().optional().default(""),
  bankDetails: z.object({
    accountName: z.string().trim().min(1),
    bankName: z.string().trim().min(1),
    accountNumber: z.string().trim().min(1),
    ifscCode: z.string().trim().length(11),
  }),
});

export const adminOrderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"]),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
});

export const sellerRejectSchema = z.object({
  reason: z.string().trim().min(10),
});
