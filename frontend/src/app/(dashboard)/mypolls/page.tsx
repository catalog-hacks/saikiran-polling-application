"use client";

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
                        <PollItem key={poll.id.toString()} poll={poll} />
                    ))}
                </div>
            )}
        </div>
    );
};

const PollItem = ({ poll }: { poll: Poll }) => {
    const frontendUrl =
        process.env.REACT_APP_FRONTEND_URL || "http://localhost:3000"; // Assuming you have an env for frontend URL
    const shareUrl = `${frontendUrl}/polls/${poll.id}`;

    const dateOptions: Intl.DateTimeFormatOptions = {
        formatMatcher: "best fit",
        dateStyle: "full",
        timeZone: "IST",
    };

    return (
        <div className="p-4 bg-gray-100 rounded-md shadow">
            <h2 className="text-lg font-semibold text-gray-800">
                {poll.question}
            </h2>
            <p className="text-sm text-gray-600">
                Created on:{" "}
                {new Date(poll.created_at).toLocaleDateString(
                    "en-US",
                    dateOptions
                )}
            </p>

            <div className="mt-4 flex space-x-4">
                <button
                    className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                >
                    Share Poll
                </button>
                <button className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
                    Manage Poll
                </button>
            </div>
        </div>
    );
};

export default UserPolls;
