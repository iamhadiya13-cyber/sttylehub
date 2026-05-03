import { apiSuccess } from "@/lib/api";

export async function POST() {
  return apiSuccess(null, "Use NextAuth signOut on the client to clear the JWT session");
}
