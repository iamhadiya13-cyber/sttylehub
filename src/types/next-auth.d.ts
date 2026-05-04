import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      avatar?: string;
      isVerified?: boolean;
      isBanned?: boolean;
    };
  }

  interface User {
    role?: string;
    avatar?: string;
    isVerified?: boolean;
    isBanned?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    avatar?: string;
    isVerified?: boolean;
    isBanned?: boolean;
  }
}
