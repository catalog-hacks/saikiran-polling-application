"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { useShallow } from "zustand/shallow";

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const router = useRouter();

    //Maximum depth will be reached if useShallow is not used with zustand
    const [status, checkSession] = useSessionStore(
        useShallow((state) => [state.status, state.checkSession])
    );
    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            if (mounted) {
                await checkSession();
            }
        };

        initSession();

        return () => {
            mounted = false;
        };
    }, [checkSession]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div>Loading...</div>
            </div>
        );
    }

    return status === "authenticated" ? <>{children}</> : null;
};

export default ProtectedRoute;
