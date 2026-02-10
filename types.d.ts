import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    username: string
  }

  interface Session extends DefaultSession {
    user: {
      username: string
      permissions: string[]
      isAdmin: boolean
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string
  }
}
