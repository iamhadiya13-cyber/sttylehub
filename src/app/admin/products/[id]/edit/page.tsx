import ProductForm from "@/components/admin/ProductForm";

export default function EditAdminProductPage({ params }: { params: { id: string } }) {
  return <ProductForm productId={params.id} />;
}
