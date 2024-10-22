"use client";

import { Poll } from "@/types/poll";
import ShareButton from "./ShareUrl";
import Link from "next/link";
import { useState } from "react";
import { usePasskeyAuth } from "@/hooks/usePasskeyAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";

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
        const response = await fetch(`/api/polls/${poll?.id}/status`, {
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
        <Card className="hover:shadow-lg transition-shadow">
            <Link href={shareUrl}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold">
                        {poll.question}
                    </CardTitle>
                    <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                </CardHeader>
            </Link>
            <CardContent>
                <div className="mt-4 flex justify-between items-center space-x-4">
                    <p className="text-sm text-gray-500">
                        Created on:{" "}
                        {new Date(poll.created_at).toLocaleDateString(
                            "en-US",
                            dateOptions
                        )}
                    </p>
                    <div className="flex space-x-4">
                        <ShareButton shareUrl={shareUrl} />
                        <Button
                            asChild={false}
                            onClick={togglePollStatus}
                            className={`${
                                isActive
                                    ? "bg-gray-600 hover:bg-gray-500"
                                    : "bg-blue-800 hover:bg-blue-700"
                            } text-white py-2 w-36 px-4 rounded-md font-semibold transition duration-300`}
                        >
                            {isActive ? "Disable" : "Enable"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PollItem;
