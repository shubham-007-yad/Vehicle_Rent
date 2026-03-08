import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname.startsWith("/login");

      if (!isLoggedIn && !isLoginPage) {
        return false; // Redirect to login
      }
      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.picture = (user as any).image;
      }
      if (trigger === "update" && session) {
        // This is called when update() is triggered on the client
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
        if (session.image) token.picture = session.image;
        if (session.role) token.role = session.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  providers: [], // Add providers in auth.ts
} satisfies NextAuthConfig;
