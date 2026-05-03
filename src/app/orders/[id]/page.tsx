import { OrderDetailPageScreen } from "@/components/screens";

export default function OrderPage({ params }: { params: { id: string } }) {
  return <OrderDetailPageScreen id={params.id} />;
}
