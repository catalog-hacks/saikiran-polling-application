"use client";

import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthPage() {
    const [isRegistering, setIsRegistering] = useState(true);
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "authenticated") {
            redirect("/");
            // User is already authenticated, redirect to homepage
        } else if (status === "loading") {
            // Session is still loading, do nothing (optional)
        } else {
            setLoading(false);
            // User is not authenticated, continue rendering the component
        }
    }, [status, redirect]);

    return (
        <>
            {!loading && (
                <div className=" flex items-center justify-center min-h-[calc(100vh_-_80px)]">
                    <div className="max-w-md w-full  shadow-md rounded-lg p-8">
                        {isRegistering ? <RegisterForm /> : <LoginForm />}

                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="mt-4 w-full bg-gray-200  py-2 rounded-lg hover:bg-gray-100 transition duration-300 text-gray-900"
                        >
                            {isRegistering
                                ? "Switch to Login"
                                : "Switch to Register"}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
