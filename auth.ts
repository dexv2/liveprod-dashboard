import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getAdmin } from "./utils/apis/post";
import { configs } from "./utils/constants";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {}
      },
      authorize: async (credentials) => {
        try {
          const { username, password } = credentials;

          // Logic to verify if admin exists
          const admin = await getAdmin(username as string, password as string);
          if (!admin.data) throw new Error("Admin not found.");
  
          return admin.data;
        } catch (error) {
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    maxAge: parseInt(configs.SESSION_MAX_AGE) * 60 * 60, // n hours in seconds
    updateAge: parseInt(configs.SESSION_UPDATE_AGE) * 60 * 60, // n hours in seconds
    strategy: "jwt", // or "database" depending on your session strategy
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Prevent appending callbackUrl recursively
      // const parsedUrl = new URL(url);
      // if (parsedUrl.searchParams.has('callbackUrl')) {
      //   parsedUrl.searchParams.delete('callbackUrl');
      //   return parsedUrl.toString();
      // }
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.username = token.username;
      }
      return session;
    }
  }
});
