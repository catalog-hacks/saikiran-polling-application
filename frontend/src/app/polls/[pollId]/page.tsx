"use client";

import { usePasskeyAuth } from "@/hooks/usePasskeyAuth";
import { Poll } from "@/types/poll";
import { NextPage } from "next";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface UserVote {
    option_ids: string[];
}

interface PollWithUserVote extends Poll {
    user_vote: UserVote | null;
}

interface PollPageProps {
    params: { pollId: string };
}

const PollPage: NextPage<PollPageProps> = ({ params }) => {
    const { data: session, status } = useSession();
    const { verifyPasskey } = usePasskeyAuth();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const [pollData, setPollData] = useState<PollWithUserVote | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    const fetchPoll = async () => {
        try {
            const response = await fetch(
                `/api/polls/${params.pollId}?userId=${session?.user?.id}`,
                {
                    method: "GET",
                }
            );
            const data = await response.json();
            setPollData(data.poll);
            if (data.poll.user_vote) {
                setSelectedOptions(data.poll.user_vote.option_ids);
            }
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
            setPollData((prev) =>
                prev ? { ...prev, poll: updatedPoll } : null
            );
        };

        eventSource.onerror = (error) => {
            console.error("SSE error:", error);
            eventSource.close();
        };

        return eventSource;
    };

    useEffect(() => {
        if (params.pollId && session?.user?.id) {
            fetchPoll();
            const eventSource = setupSSE();
            return () => {
                eventSource.close();
            };
        }
    }, [params.pollId, session?.user?.id]);

    const handleVote = async () => {
        if (!session?.user?.email) return;
        try {
            const isVerified = await verifyPasskey(session?.user?.email);
            if (!isVerified) {
                return;
            }
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

    if (!pollData || !Array.isArray(pollData.options))
        return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto mt-8 p-6">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
                {pollData.question}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Voting Section */}
                <div className="bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        Cast Your Vote
                    </h2>
                    <ul className="space-y-4">
                        {pollData.options.map((option) => (
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
                                                    (id) =>
                                                        id !==
                                                        option.id.toString()
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
                                    {option.text}
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

                {/* Results Section */}
                <div className="bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        Live Results
                    </h2>
                    <div className="space-y-4">
                        {pollData.options.map((option) => {
                            const totalVotes = pollData.options.reduce(
                                (sum, opt) => sum + opt.count,
                                0
                            );
                            const percentage =
                                totalVotes > 0
                                    ? Math.round(
                                          (option.count / totalVotes) * 100
                                      )
                                    : 0;

                            return (
                                <div key={option.id.toString()}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-700">
                                            {option.text}
                                        </span>
                                        <span className="text-gray-600">
                                            {option.count} votes ({percentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-500 h-2.5 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PollPage;
