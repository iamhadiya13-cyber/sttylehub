export const ORDER_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    variant: "warning" as const,
    icon: "⏳",
    description: "Order received, awaiting confirmation",
  },
  confirmed: {
    label: "Confirmed",
    variant: "info" as const,
    icon: "✅",
    description: "Order confirmed by seller",
  },
  processing: {
    label: "Processing",
    variant: "purple" as const,
    icon: "⚙️",
    description: "Your order is being prepared",
  },
  shipped: {
    label: "Shipped",
    variant: "info" as const,
    icon: "🚚",
    description: "Order is on its way",
  },
  delivered: {
    label: "Delivered",
    variant: "success" as const,
    icon: "📦",
    description: "Order delivered successfully",
  },
  cancelled: {
    label: "Cancelled",
    variant: "error" as const,
    icon: "❌",
    description: "Order was cancelled",
  },
  returned: {
    label: "Returned",
    variant: "warning" as const,
    icon: "↩️",
    description: "Return in progress",
  },
};

export const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
