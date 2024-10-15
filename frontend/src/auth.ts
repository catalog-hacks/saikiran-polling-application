import NextAuth from "next-auth";
import {
    startRegistration,
    startAuthentication,
} from "@simplewebauthn/browser";
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
                        id: userData.id,
                        email: userData.email,
                        name: userData.name,
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

async function registerUser(email: string, name: string) {
    console.log("Register user called ", email, name);

    const beginRes = await fetch(`${next_auth_url}/api/auth/register/begin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
    });

    // Log the response status and text for debugging
    console.log("Begin registration status:", beginRes.status);
    const beginText = await beginRes.text(); // Get the raw text response
    console.log("Begin registration response text:", beginText);

    if (!beginRes.ok) {
        throw new Error(
            "Failed to fetch beginData from register/begin endpoint"
        );
    }

    let beginData;
    try {
        beginData = JSON.parse(beginText); // Try to parse the JSON response
    } catch (error) {
        throw new Error(`Failed to parse beginData: ${error}`);
    }

    const regResult = await startRegistration(beginData);

    const finishRes = await fetch(`${next_auth_url}/api/auth/register/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: beginData.user.id, data: regResult }),
    });

    const finishText = await finishRes.text();
    console.log("Finish registration response:", finishText);

    let finishData;
    try {
        finishData = JSON.parse(finishText);
    } catch (error) {
        throw new Error("Failed to parse finishData: " + error);
    }

    if (finishRes.ok) {
        return { id: beginData.user.id, email, name };
    }

    throw new Error("Registration failed");
}

async function loginUser(email: string) {
    const beginRes = await fetch(`${next_auth_url}/api/auth/login/begin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    const beginData = await beginRes.json();

    const authResult = await startAuthentication(beginData);

    const finishRes = await fetch(`${next_auth_url}/api/auth/login/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: beginData.user.id, data: authResult }),
    });

    if (finishRes.ok) {
        return { id: beginData.user.id, email };
    }

    throw new Error("Authentication failed");
}
