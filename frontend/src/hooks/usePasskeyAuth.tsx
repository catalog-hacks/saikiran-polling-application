import { useState } from "react";
import {
    startRegistration,
    startAuthentication,
} from "@simplewebauthn/browser";
import { signIn } from "next-auth/react";

export function usePasskeyAuth() {
    const [error, setError] = useState<string | null>(null);

    const register = async (email: string, name: string) => {
        try {
            // Start registration
            const beginRes = await fetch("/api/auth/register/begin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name }),
            });
            const beginData = await beginRes.json();
            // Perform client-side registration
            const regResult = await startRegistration(
                beginData.data.options.publicKey
            );
            // Verify registration
            const verifyRes = await fetch("/api/auth/register/finish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: beginData.data.userId,
                    data: regResult,
                }),
            });

            if (verifyRes.ok) {
                // Registration successful, now sign in
                const result = await signIn("credentials", {
                    email,
                    name,
                    action: "register",
                    redirect: false,
                });

                if (result?.error) {
                    setError(result.error);
                }

                return result;
            } else {
                setError("Registration failed");
            }
        } catch (err) {
            setError("Registration failed");
            console.error(err);
        }
    };

    const login = async (email: string) => {
        try {
            // Start authentication
            const beginRes = await fetch("/api/auth/login/begin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const beginData = await beginRes.json();

            // Perform client-side authentication
            const authResult = await startAuthentication(
                beginData.data.publicKey
            );

            // Verify authentication
            const verifyRes = await fetch("/api/auth/login/finish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, data: authResult }),
            });

            if (verifyRes.ok) {
                // Authentication successful, now sign in
                const result = await signIn("credentials", {
                    email,
                    action: "login",
                    redirect: false,
                });

                if (result?.error) {
                    setError(result.error);
                }

                return result;
            } else {
                setError("Authentication failed");
            }
        } catch (err) {
            setError("Authentication failed");
            console.error(err);
        }
    };

    return { register, login, error };
}
