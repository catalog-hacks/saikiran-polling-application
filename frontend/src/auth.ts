import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
const next_auth_url = process.env.NEXTAUTH_URL;
export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Passkey",
            credentials: {
                email: { label: "Email", type: "text" },
                name: { label: "Name", type: "text" },
                action: { label: "Action", type: "hidden" },
            },
            async authorize(credentials, req) {
                const { email, name, action } = credentials as {
                    email: string;
                    name: string;
                    action: string;
                };
                const verifyRes = await fetch(
                    `${next_auth_url}/api/auth/verify`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, action }),
                    }
                );

                if (verifyRes.ok) {
                    const userData = await verifyRes.json();
                    return {
                        id: userData.data.id,
                        email: userData.data.email,
                        name: userData.data.name,
                    };
                }

                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/signin",
    },
});
