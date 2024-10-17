"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { MenuIcon } from "lucide-react";

const Navbar = () => {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (status === "loading") {
        } else {
            setLoading(false);
        }
    }, [status]);

    return (
        <nav
            className={`fixed top-0 left-0 w-full h-20 z-50 flex justify-between items-center p-4 transition-all duration-300 ${"bg-white shadow-md dark:bg-zinc-900"}`}
        >
            <div className="flex items-center">
                <Link
                    href="/"
                    className="text-2xl font-semibold dark:text-white"
                >
                    PollingApp
                </Link>

                <div className="hidden md:flex ml-6 space-x-6">
                    <Link
                        href="#"
                        className="text-gray-700 hover:text-blue-500 dark:text-gray-300"
                    >
                        Link 1
                    </Link>
                    <Link
                        href="#"
                        className="text-gray-700 hover:text-blue-500 dark:text-gray-300"
                    >
                        Link 2
                    </Link>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                {!loading && (
                    <>
                        {status === "authenticated" ? (
                            <>
                                <button
                                    onClick={() => signOut()}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <Link href="/auth">
                                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
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
