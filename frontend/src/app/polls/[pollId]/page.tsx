"use client";

import { Poll } from "@/types/poll";
import { NextPage } from "next";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface PollPageProps {
    params: { pollId: string };
}

const PollPage: NextPage<PollPageProps> = ({ params }) => {
    const { data: session, status } = useSession();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const [poll, setPoll] = useState<Poll | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    const fetchPoll = async () => {
        try {
            const response = await fetch(`/api/polls/${params.pollId}`, {
                method: "GET",
            });
            const data = await response.json();
            setPoll(data.poll);
        } catch (error) {
            console.error("Error fetching poll:", error);
        }
    };

    const setupSSE = () => {
        const eventSource = new EventSource(
            `${backendUrl}/polls/${params.pollId}/stream`
        );

        eventSource.onmessage = (event) => {
            const updatedPoll = JSON.parse(event.data);
            setPoll(updatedPoll);
        };

        eventSource.onerror = (error) => {
            console.error("SSE error:", error);
            eventSource.close();
        };

        return eventSource;
    };

    useEffect(() => {
        if (params.pollId) {
            fetchPoll();
            const eventSource = setupSSE();
            return () => {
                eventSource.close();
            };
        }
    }, [params.pollId]);

    const handleVote = async () => {
        try {
            await fetch(`${backendUrl}/polls/${params.pollId}/vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: session?.user?.id,
                    option_ids: selectedOptions,
                }),
            });
            fetchPoll();
        } catch (error) {
            console.error("Error voting:", error);
        }
    };

    // Check if poll is null or options is not an array
    if (!poll || !Array.isArray(poll.options)) return <div>Loading...</div>;

    return (
        <div className="max-w-xl mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
                {poll.question}
            </h1>

            <ul className="space-y-4">
                {poll.options.map((option) => (
                    <li
                        key={option.id.toString()}
                        className="flex items-center"
                    >
                        <input
                            type="checkbox"
                            id={option.id.toString()}
                            name="poll-option"
                            value={option.id.toString()}
                            checked={selectedOptions.includes(
                                option.id.toString()
                            )}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedOptions([
                                        ...selectedOptions,
                                        option.id.toString(),
                                    ]);
                                } else {
                                    setSelectedOptions(
                                        selectedOptions.filter(
                                            (id) => id !== option.id.toString()
                                        )
                                    );
                                }
                            }}
                            className="h-5 w-5 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <label
                            htmlFor={option.id.toString()}
                            className="ml-3 text-gray-700 text-lg"
                        >
                            {option.text}{" "}
                            <span className="text-sm text-gray-500">
                                ({option.count} votes)
                            </span>
                        </label>
                    </li>
                ))}
            </ul>

            <button
                onClick={handleVote}
                disabled={selectedOptions.length === 0}
                className={`mt-6 w-full py-2 px-4 rounded-md text-white ${
                    selectedOptions.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600"
                }`}
            >
                Vote
            </button>
        </div>
    );
};

export default PollPage;
