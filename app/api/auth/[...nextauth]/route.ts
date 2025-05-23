import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@/lib/generated/prisma"
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // ... your existing CredentialsProvider ...
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Ensure the user exists in your database
        const existingUser = await prisma.user.findUnique({
          where: { email: profile?.email }
        });
        
        if (!existingUser) {
          // Create user if they don't exist
          await prisma.user.create({
            data: {
              email: profile?.email,
              name: profile?.name,
              // Set a random password for Google users (won't be used)
              password: await bcrypt.hash(Math.random().toString(36).slice(-8), 12)
            }
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      // Persist user data from Google to the token
      if (account?.provider === "google" && profile) {
        const dbUser = await prisma.user.findUnique({
          where: { email: profile.email }
        });
        
        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
        }
      } else if (user) {
        // For credential users
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    }
  },
  // ... rest of your config ...

  pages: {
    signIn: "/signin",
    newUser: "/signup",
    error: "/signin"
  },
  debug: process.env.NODE_ENV === "development"
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }