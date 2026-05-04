import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { WishlistPageScreen } from "@/components/screens";
import { authOptions } from "@/lib/auth";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  return <WishlistPageScreen />;
}
