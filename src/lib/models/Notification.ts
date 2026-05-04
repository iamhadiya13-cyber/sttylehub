import { Schema, model, models, type InferSchemaType } from "mongoose";

const NotificationSchema = new Schema(
  {
    type: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: "", trim: true },
    recipientUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    relatedId: { type: Schema.Types.ObjectId, default: null },
    relatedModel: { type: String, default: "", trim: true },
    applicantName: { type: String, default: "", trim: true },
    shopName: { type: String, default: "", trim: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

NotificationSchema.index({ createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof NotificationSchema>;
export const Notification = models.Notification || model("Notification", NotificationSchema);
export default Notification;
