import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const { id } = params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  const product = isObjectId
    ? await Product.findById(id).select("variants colors colorImages")
    : await Product.findOne({ slug: id }).select("variants colors colorImages");

  if (!product) {
    return NextResponse.json(
      { success: false, message: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      variants: product.variants,
      colors: product.colors,
      colorImages: product.colorImages
        ? Object.fromEntries(product.colorImages)
        : {},
    },
  });
}
