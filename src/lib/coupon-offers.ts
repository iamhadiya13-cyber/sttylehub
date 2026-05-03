export type AvailableCouponOffer = {
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  audienceType?: string;
  expiryDate?: string;
};

export function getCouponDescription(coupon: AvailableCouponOffer) {
  return coupon.discountType === "percentage"
    ? `${coupon.discountValue}% off`
    : `Flat ₹${coupon.discountValue} off`;
}

export function getCouponExpiryMeta(expiryDate?: string) {
  if (!expiryDate) {
    return { label: null, urgent: false };
  }

  const remainingMs = new Date(expiryDate).getTime() - Date.now();
  const daysLeft = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    return { label: null, urgent: false };
  }

  if (daysLeft === 1) {
    return { label: "Expires today", urgent: true };
  }

  return {
    label: `Expires in ${daysLeft} days`,
    urgent: daysLeft < 3,
  };
}

export function calculateCouponPreview(coupon: AvailableCouponOffer, subtotal: number) {
  const minOrderAmount = coupon.minOrderAmount || 0;
  const qualifies = subtotal >= minOrderAmount;
  const remainingToUnlock = qualifies ? 0 : Math.max(0, minOrderAmount - subtotal);

  if (!qualifies) {
    return {
      qualifies,
      remainingToUnlock,
      discountAmount: 0,
      newTotal: subtotal,
      savingsAmount: 0,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
    if ((coupon.maxDiscountAmount || 0) > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount || 0);
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, subtotal);
  }

  return {
    qualifies,
    remainingToUnlock: 0,
    discountAmount,
    newTotal: Math.max(0, subtotal - discountAmount),
    savingsAmount: discountAmount,
  };
}
