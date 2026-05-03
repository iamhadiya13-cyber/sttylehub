import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { getStoreConfig } from "@/lib/models/StoreConfig";
import { calculateShipping } from "@/lib/shipping";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    const subtotal = Number(url.searchParams.get("subtotal") || 0);

    await connectDB();
    const config = await getStoreConfig();
    const shipping = await calculateShipping(subtotal, session?.user?.id);

    let completedOrders = 0;
    if (session?.user?.id) {
      completedOrders = await Order.countDocuments({
        user: session.user.id,
        orderStatus: "delivered",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        shippingFee: shipping.fee,
        label: shipping.label,
        reason: shipping.reason,
        freeShippingThreshold: config.freeShippingThreshold,
        defaultShippingFee: config.defaultShippingFee,
        completedOrders,
        loyaltyShippingRules: config.loyaltyShippingRules || [],
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch shipping config";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
