// app/polls/user/ClientPollsList.tsx
"use client";

import PollItem from "@/components/dashboard/PollItem";
import { Poll } from "@/types/poll";
import { useEffect, useState } from "react";
import { useSessionStore } from "@/store/useSessionStore";
import { useShallow } from "zustand/shallow";

interface ClientPollsListProps {
    initialPolls: Poll[];
}

export default function PollsList({ initialPolls }: ClientPollsListProps) {
    const [polls, setPolls] = useState<Poll[]>(initialPolls);
    const [error, setError] = useState("");
    const [email] = useSessionStore(useShallow((state) => [state.email]));

    // Optional: Refresh polls periodically or on specific events
    const refreshPolls = async () => {
        try {
            const response = await fetch(`/api/polls/userpolls`);
            if (!response.ok) {
                throw new Error("Failed to fetch polls");
            }
            const data = await response.json();
            setPolls(data.polls);
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    return (
        <>
            {polls.length === 0 ? (
                <p>No polls created yet.</p>
            ) : (
                <div className="space-y-6">
                    {polls.map((poll) => (
                        <PollItem
                            key={poll.id.toString()}
                            poll={poll}
                            email={email as string}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
