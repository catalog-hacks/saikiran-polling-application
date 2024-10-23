"use client";

import { Poll } from "@/types/poll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import ShareButton from "./dashboard/ShareUrl";

interface PollCardProps {
    poll: Poll;
}

export default function PollCard({ poll }: PollCardProps) {
    const dateOptions: Intl.DateTimeFormatOptions = {
        formatMatcher: "best fit",
        dateStyle: "full",
        timeZone: "IST",
    };
    const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
    const shareUrl = `${frontendUrl}/polls/${poll.id}`;
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <Link href={`/polls/${poll.id}`} className=" cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold">
                        {poll.question}
                    </CardTitle>
                    <Badge variant={poll.active ? "default" : "secondary"}>
                        {poll.active ? "Active" : "Closed"}
                    </Badge>
                </CardHeader>
            </Link>
            <CardContent>
                <p className="text-sm text-gray-500 mb-4">{poll.description}</p>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                        Created on:{" "}
                        {new Date(poll.created_at).toLocaleDateString(
                            "en-US",
                            dateOptions
                        )}
                    </p>
                    <ShareButton shareUrl={shareUrl} />
                </div>
            </CardContent>
        </Card>
    );
}
