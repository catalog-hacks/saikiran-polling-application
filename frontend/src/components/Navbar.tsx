"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { MenuIcon } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useSessionStore } from "@/store/useSessionStore";

const Navbar = () => {
    const [status, checkSession] = useSessionStore(
        useShallow((state) => [state.status, state.checkSession])
    );
    const [loading, setLoading] = useState(true);
    useLayoutEffect(() => {
        checkSession();
    }, [checkSession]);

    useEffect(() => {
        if (status === "loading") {
        } else {
            setLoading(false);
        }
    }, [status]);

    return (
        <nav
            className={`fixed top-0 left-0 w-full h-20 z-50 flex justify-between items-center p-4 transition-all duration-300 ${"bg-white shadow-md dark:bg-gray-800"}`}
        >
            <div className="flex items-center">
                <Link
                    href="/"
                    className="text-2xl font-semibold dark:text-white"
                >
                    PollingApp
                </Link>
                {status === "authenticated" && (
                    <div className="hidden md:flex ml-6 space-x-6">
                        <Link
                            href="/create"
                            className="text-gray-700 hover:text-blue-500 dark:text-gray-300"
                        >
                            Create
                        </Link>
                        <Link
                            href="/mypolls"
                            className="text-gray-700 hover:text-blue-500 dark:text-gray-300"
                        >
                            Dashboard
                        </Link>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-4">
                {!loading && (
                    <>
                        {status === "authenticated" ? (
                            <>
                                <button
                                    onClick={() => signOut()}
                                    className="px-6 py-3 flex items-center bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-gray-900 transition duration-300 shadow-md"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <Link href="/auth">
                                <button className="px-6 py-3 flex items-center bg-blue-800 text-white rounded-full font-semibold hover:bg-blue-700 transition duration-300 shadow-md">
                                    Sign In
                                </button>
                            </Link>
                        )}
                    </>
                )}

                <button className="md:hidden">
                    <MenuIcon className="w-6 h-6" />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
