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
      colorway?: "void" | "infrared" | "arctic";
    };
  }

  interface User {
    role?: string;
    avatar?: string;
    isVerified?: boolean;
    isBanned?: boolean;
    colorway?: "void" | "infrared" | "arctic";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    avatar?: string;
    isVerified?: boolean;
    isBanned?: boolean;
    colorway?: "void" | "infrared" | "arctic";
  }
}
