import { Schema, model, models, type InferSchemaType } from "mongoose";

const AddressSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    fullName: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    street: { type: String, required: true, trim: true },
    locality: { type: String, default: "", trim: true },
    landmark: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: "India", trim: true },
    addressType: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true },
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "seller", "admin"], default: "user", index: true },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    dateOfBirth: { type: Date, default: null },
    genderPreference: { type: String, enum: ["men", "women", "unisex"], default: "unisex" },
    addresses: [AddressSchema],
    isVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false, index: true },
    emailVerifyToken: { type: String, default: null, select: false },
    emailVerifyExpiry: { type: Date, default: null, select: false },
    emailOtp: { type: String, default: null, select: false },
    emailOtpExpiry: { type: Date, default: null, select: false },
    emailOtpSentAt: { type: Date, default: null, select: false },
    resetPasswordOTP: { type: String, default: null, select: false },
    resetPasswordExpiry: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof UserSchema>;
export type AddressDocument = InferSchemaType<typeof AddressSchema>;

export const User = models.User || model("User", UserSchema);
export default User;
