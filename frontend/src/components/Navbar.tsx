"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { MenuIcon } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useSessionStore } from "@/store/useSessionStore";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "./ui/button";

const Navbar = () => {
    const [status, username, checkSession] = useSessionStore(
        useShallow((state) => [
            state.status,
            state.username,
            state.checkSession,
        ])
    );
    const [loading, setLoading] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useLayoutEffect(() => {
        checkSession();
    }, [checkSession]);

    useEffect(() => {
        if (status === "loading") {
            setLoading(true);
        } else {
            setLoading(false);
        }
    }, [status]);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleSignOut = () => {
        setDropdownOpen(false);
        signOut();
    };

    return (
        <nav
            className={`fixed top-0 left-0 w-full h-20 z-50 flex justify-between items-center p-4 transition-all duration-300   shadow-md bg-gray-800`}
        >
            <div className="flex items-center">
                <Link href="/" className="text-2xl font-semibold text-white">
                    PollingApp
                </Link>
                <Link
                    href={"/polls"}
                    className=" ml-6  hover:text-blue-500 text-gray-300"
                >
                    Polls
                </Link>
                {status === "authenticated" && (
                    <div className="hidden md:flex ml-6 space-x-6">
                        <Link
                            href="/create"
                            className=" hover:text-blue-500 text-gray-300"
                        >
                            Create
                        </Link>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-4 relative">
                {!loading && (
                    <>
                        {status === "authenticated" ? (
                            <>
                                <div className="relative">
                                    <Button
                                        onClick={toggleDropdown}
                                        className="flex items-center justify-center px-6 py-3 bg-blue-800 text-white  font-semibold hover:bg-blue-700 transition duration-300 shadow-md"
                                    >
                                        {username}
                                        <ChevronDownIcon className=" ml-1 mt-1 w-4 h-4" />
                                    </Button>
                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg dark:bg-gray-700">
                                            <Link
                                                href={"/mypolls"}
                                                onClick={toggleDropdown}
                                                className="block w-full text-left px-4 py-2  rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                                            >
                                                Dashboard
                                            </Link>
                                            <button
                                                onClick={handleSignOut}
                                                className="block w-full text-left px-4 py-2  rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <Link href="/auth">
                                <Button className="px-6 py-3 flex items-center bg-blue-800 text-white font-semibold hover:bg-blue-700 transition duration-300 shadow-md">
                                    Sign In
                                </Button>
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
