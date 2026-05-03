import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { getStoreConfig } from "@/lib/models/StoreConfig";

type LoyaltyRule = {
  minOrders: number;
  shippingFee: number;
  label?: string;
};

export async function calculateShipping(
  cartTotal: number,
  userId?: string,
): Promise<{
  fee: number;
  label: string;
  reason: string;
}> {
  await connectDB();
  const config = await getStoreConfig();

  if (cartTotal >= config.freeShippingThreshold) {
    return {
      fee: 0,
      label: "Free",
      reason: `Free above ₹${config.freeShippingThreshold}`,
    };
  }

  if (userId && config.loyaltyShippingRules?.length) {
    const orderCount = await Order.countDocuments({
      user: userId,
      orderStatus: "delivered",
    });

    const qualifyingRules = (config.loyaltyShippingRules as LoyaltyRule[])
      .filter((rule) => orderCount >= rule.minOrders)
      .sort((a, b) => b.minOrders - a.minOrders);

    if (qualifyingRules.length > 0) {
      const rule = qualifyingRules[0];
      return {
        fee: rule.shippingFee,
        label: rule.shippingFee === 0 ? "Free" : `₹${rule.shippingFee}`,
        reason: rule.label || "Loyalty shipping rate",
      };
    }
  }

  return {
    fee: config.defaultShippingFee,
    label: `₹${config.defaultShippingFee}`,
    reason: "Standard shipping",
  };
}
