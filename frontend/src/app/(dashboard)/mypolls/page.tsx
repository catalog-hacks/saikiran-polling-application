"use client";

import PollItem from "@/components/dashboard/PollItem";
import { useSessionStore } from "@/store/useSessionStore";
import { Poll } from "@/types/poll";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

const UserPolls = () => {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [error, setError] = useState("");
    const [user_id, email] = useSessionStore(
        useShallow((state) => [state.user_id, state.email])
    );
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    useEffect(() => {
        fetchPollsByUser();
    }, [user_id]);

    const fetchPollsByUser = async () => {
        try {
            const response = await fetch(
                `${backendUrl}/userpolls?userId=${user_id}`
            );
            if (!response.ok) {
                throw new Error("Failed to fetch polls");
            }
            const data = await response.json();
            setPolls(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    return (
        <div className=" mx-auto p-6  ">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
                Your Polls
            </h1>
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
        </div>
    );
};

export default UserPolls;
