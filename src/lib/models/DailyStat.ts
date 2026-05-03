import { Schema, model, models, type InferSchemaType } from "mongoose";

const DailyStatSchema = new Schema(
  {
    date: { type: Date, unique: true, required: true, index: true },
    revenue: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type DailyStatDocument = InferSchemaType<typeof DailyStatSchema>;
export const DailyStat = models.DailyStat || model("DailyStat", DailyStatSchema);
