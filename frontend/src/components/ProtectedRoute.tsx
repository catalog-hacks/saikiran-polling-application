"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { useShallow } from "zustand/shallow";

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();

    const [status] = useSessionStore(useShallow((state) => [state.status]));

    useEffect(() => {
        if (status === "unauthenticated") {
            const callbackUrl = encodeURIComponent(pathname);
            router.push(`/auth?callbackUrl=${callbackUrl}`);
        }
    }, [status, router, pathname]);

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
