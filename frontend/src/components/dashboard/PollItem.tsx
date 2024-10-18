"use client";

import { Poll } from "@/types/poll";
import ShareButton from "./ShareUrl";
import Link from "next/link";
import { useState } from "react";
import { usePasskeyAuth } from "@/hooks/usePasskeyAuth";

const PollItem = ({ poll, email }: { poll: Poll; email: string }) => {
    const [isActive, setIsActive] = useState(poll.active);
    const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const shareUrl = `${frontendUrl}/polls/${poll.id}`;
    const { verifyPasskey } = usePasskeyAuth();

    const dateOptions: Intl.DateTimeFormatOptions = {
        formatMatcher: "best fit",
        dateStyle: "full",
        timeZone: "IST",
    };

    const togglePollStatus = async () => {
        const newStatus = !isActive;
        const isVerified = await verifyPasskey(email);
        if (!isVerified) {
            return;
        }
        const response = await fetch(`${backendUrl}/polls/${poll.id}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ active: newStatus }),
        });

        if (response.ok) {
            setIsActive(newStatus);
        } else {
            console.error("Failed to update poll status");
        }
    };

    return (
        <div className="p-4 bg-white rounded-md shadow">
            <Link href={shareUrl}>
                <h2 className="text-lg font-semibold text-gray-800 hover:text-blue-700 duration-300">
                    {poll.question}
                </h2>
            </Link>
            <p className="text-sm text-gray-600">
                Created on:{" "}
                {new Date(poll.created_at).toLocaleDateString(
                    "en-US",
                    dateOptions
                )}
            </p>

            <div className="mt-4 flex justify-between space-x-4 items-center">
                <span
                    className={`${
                        isActive ? "text-green-600" : "text-red-600"
                    } text-sm `}
                >
                    Status: {isActive ? "active" : "inactive"}
                </span>
                <div className=" flex space-x-4">
                    <ShareButton shareUrl={shareUrl} />
                    <button
                        onClick={togglePollStatus}
                        className={`${
                            isActive
                                ? "bg-red-700 hover:bg-red-500"
                                : "bg-blue-800 hover:bg-blue-700"
                        } text-white py-2 w-36 px-4 rounded-md `}
                    >
                        {isActive ? "Disable" : "Enable"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PollItem;
