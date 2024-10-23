"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const SideBarNav = ({ links }: { links: { name: string; path: string }[] }) => {
    const pathname = usePathname();
    return (
        <nav className="flex-1 p-4">
            <ul>
                {links.map((link) => (
                    <li key={link.path} className="mb-2">
                        <Link
                            href={link.path}
                            className={`block py-2 px-4 rounded-lg transition-colors duration-200 ${
                                pathname === link.path
                                    ? "bg-gray-700 text-white font-semibold"
                                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                            }`}
                        >
                            {link.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default SideBarNav;
