"use client";

import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { useSessionStore } from "@/store/useSessionStore";
import { redirect, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

export default function AuthPage() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [status] = useSessionStore(useShallow((state) => [state.status]));
    const [loading, setLoading] = useState(true);

    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    useEffect(() => {
        if (status === "authenticated") {
            redirect(callbackUrl);
        } else if (status === "loading") {
            // Session is still loading, do nothing (optional)
        } else {
            setLoading(false);
        }
    }, [status, callbackUrl]);

    return (
        <>
            {!loading && (
                <div className=" flex items-center justify-center min-h-[calc(100vh_-_80px)]">
                    <div className="max-w-md w-full  shadow-md bg-white rounded-lg p-8">
                        {isRegistering ? (
                            <RegisterForm callbackUrl={callbackUrl} />
                        ) : (
                            <LoginForm callbackUrl={callbackUrl} />
                        )}

                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="mt-4 w-full font-semibold bg-gray-200  py-2 rounded-lg hover:bg-gray-100 transition duration-300 text-gray-900"
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
