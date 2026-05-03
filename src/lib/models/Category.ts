import { Schema, model, models, type InferSchemaType } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    image: { type: String, default: "" },
    gender: {
      type: String,
      enum: ["men", "women", "unisex", "all"],
      default: "all",
      index: true,
    },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    isActive: { type: Boolean, default: true, index: true },
    productCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export type CategoryDocument = InferSchemaType<typeof CategorySchema>;
export const Category = models.Category || model("Category", CategorySchema);
export default Category;
