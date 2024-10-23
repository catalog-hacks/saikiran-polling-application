"use client";

import ShareButton from "@/components/dashboard/ShareUrl";
import { usePasskeyAuth } from "@/hooks/usePasskeyAuth";
import { useSessionStore } from "@/store/useSessionStore";
import { Poll } from "@/types/poll";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { useShallow } from "zustand/shallow";
import { PollWithUserVote } from "@/types/poll";

interface ClientPollComponentProps {
    initialPollData: PollWithUserVote;
    pollId: string;
}

const PollComponent: NextPage<ClientPollComponentProps> = ({
    initialPollData,
    pollId,
}) => {
    const [user_id, email, checkSession] = useSessionStore(
        useShallow((state) => [state.user_id, state.email, state.checkSession])
    );
    const { verifyPasskey } = usePasskeyAuth();
    const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const [shareUrl, setShareUrl] = useState(`${frontendUrl}/polls/${pollId}`);
    const [pollData, setPollData] = useState<PollWithUserVote>(initialPollData);
    const [selectedOptions, setSelectedOptions] = useState<string[]>(
        initialPollData?.user_vote?.option_ids || []
    );
    const [initialVote, setInitialVote] = useState<string[]>(
        initialPollData?.user_vote?.option_ids || []
    );
    const [voteChanged, setVoteChanged] = useState<boolean>(false);
    const [isCreator, setIsCreator] = useState<boolean>(
        initialPollData?.created_by?.toString() == user_id
    );
    const [chartType, setChartType] = useState<"bar" | "pie">("bar");

    const fetchPoll = async () => {
        try {
            const response = await fetch(`/api/polls/${pollId}`, {
                method: "GET",
            });
            const data = await response.json();
            setPollData(data.poll);
            setShareUrl(`${frontendUrl}/polls/${data.poll.id}`);
            if (data?.poll?.user_vote) {
                setSelectedOptions(data.poll.user_vote.option_ids);
                setInitialVote(data.poll.user_vote.option_ids);
            }
            if (data?.poll?.created_by === user_id) {
                setIsCreator(true);
            }
        } catch (error) {
            console.error("Error fetching poll:", error);
        }
    };

    const setupSSE = () => {
        const connectSSE = () => {
            const eventSource = new EventSource(
                `${backendUrl}/polls/${pollId}/stream`,
                { withCredentials: false }
            );

            eventSource.onopen = () => {
                console.log("SSE connection established");
            };

            eventSource.onmessage = (event) => {
                try {
                    const updatedPoll = JSON.parse(event.data);
                    setPollData((prev) =>
                        prev
                            ? {
                                  ...updatedPoll,
                                  user_vote: prev.user_vote,
                              }
                            : null
                    );
                } catch (error) {
                    console.error("Error parsing SSE data:", error);
                }
            };

            eventSource.onerror = (error) => {
                console.error("SSE error:", error);
                console.log("SSE readyState:", eventSource);
            };

            return eventSource;
        };

        const eventSource = connectSSE();

        return () => {
            console.log("Cleaning up SSE connection...");
            eventSource.close();
        };
    };

    useEffect(() => {
        if (pollId && user_id) {
            const cleanUp = setupSSE();
            return cleanUp;
        }
    }, [pollId, user_id]);

    useEffect(() => {
        setIsCreator(initialPollData?.created_by?.toString() == user_id);
    }, [user_id, initialPollData]);

    useEffect(() => {
        setVoteChanged(
            selectedOptions.sort().toString() !== initialVote.sort().toString()
        );
    }, [selectedOptions, initialVote]);

    const handleVote = async () => {
        if (typeof email !== "string" || !pollData?.active) return;

        try {
            const isVerified = await verifyPasskey(email);
            if (!isVerified) {
                return;
            }
            const response = await fetch(`/api/polls/${pollId}/vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    option_ids: selectedOptions,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to vote");
            }

            fetchPoll();
            setVoteChanged(false);
        } catch (error) {
            console.error("Error voting:", error);
        }
    };

    const handleOptionChange = (optionId: string, isChecked: boolean) => {
        if (pollData?.multiple_choices) {
            if (isChecked) {
                setSelectedOptions([...selectedOptions, optionId]);
            } else {
                setSelectedOptions(
                    selectedOptions.filter((id) => id !== optionId)
                );
            }
        } else {
            setSelectedOptions([optionId]);
        }
    };

    const togglePollStatus = async () => {
        const newStatus = !pollData?.active;

        try {
            const isVerified = await verifyPasskey(email as string);
            if (!isVerified) {
                return;
            }
            const response = await fetch(`/api/polls/${pollData?.id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ active: newStatus }),
            });

            if (response.ok) {
                setPollData((prev) => {
                    if (!prev) return prev;

                    return {
                        ...prev,
                        active: newStatus,
                    };
                });
            } else {
                console.error("Failed to update poll status");
            }
        } catch (error) {
            console.error("Error toggling poll status:", error);
        }
    };

    const clearPollVotes = async () => {
        try {
            const isVerified = await verifyPasskey(email as string);
            if (!isVerified) {
                return;
            }

            const response = await fetch(
                `/api/polls/${pollData?.id}/clear-votes`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.ok) {
                setPollData((prev) => {
                    if (!prev) return prev;

                    const updatedOptions = prev.options.map((option) => ({
                        ...option,
                        count: 0,
                    }));

                    return {
                        ...prev,
                        options: updatedOptions,
                        user_vote: { option_ids: [] },
                    };
                });
                setInitialVote([]);
                setSelectedOptions([]);
                setVoteChanged(true);
            } else {
                console.error("Failed to clear poll votes");
            }
        } catch (error) {
            console.error("Error clearing poll votes:", error);
        }
    };

    const chartData =
        pollData?.options?.map((option) => ({
            name: option.text,
            votes: option.count,
        })) || [];

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

    if (!pollData || !Array.isArray(pollData.options)) {
        return <div>Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto pt-16 p-6 ">
            <div className=" mb-8 text-center text-gray-800 flex flex-col space-y-4 items-center justify-center space-x-2">
                <h1 className="text-3xl font-bold">{pollData.question}</h1>
                <p>{pollData?.description}</p>
            </div>

            {!pollData.active && (
                <div className="text-red-600 text-center font-bold text-lg mb-8">
                    This poll is no longer active.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Voting Section */}
                <div
                    className={`bg-white shadow-lg rounded-lg p-6 ${
                        !pollData.active ? "opacity-50" : ""
                    }`}
                >
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        Cast Your Vote
                    </h2>

                    <ul className="space-y-4">
                        {pollData.options.map((option) => (
                            <li
                                key={option.id.toString()}
                                className="flex items-center border px-2 py-2 rounded-md shadow"
                            >
                                <input
                                    type={
                                        pollData?.multiple_choices
                                            ? "checkbox"
                                            : "radio"
                                    }
                                    id={option.id.toString()}
                                    name="poll-option"
                                    value={option.id.toString()}
                                    checked={selectedOptions.includes(
                                        option.id.toString()
                                    )}
                                    disabled={!pollData.active}
                                    onChange={(e) =>
                                        handleOptionChange(
                                            option.id.toString(),
                                            e.target.checked
                                        )
                                    }
                                    className="h-5 w-5 text-blue-800 border-gray-300 rounded focus:ring-2 focus:ring-blue-800"
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
                        disabled={
                            !pollData.active ||
                            selectedOptions.length === 0 ||
                            !voteChanged
                        }
                        className={`mt-6 w-full py-2 px-4 rounded-md font-semibold text-white ${
                            selectedOptions.length === 0 ||
                            !voteChanged ||
                            !pollData.active
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-800 hover:bg-blue-700"
                        }`}
                    >
                        {voteChanged && initialVote.length !== 0
                            ? "Change my vote"
                            : "Vote"}
                    </button>
                </div>

                {/* Results Section */}
                <div className="bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        {pollData.active ? "Live " : " "}Results
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
                                    <div className="flex justify-between mb-1 px-2 py-2">
                                        <span className="text-gray-700">
                                            {option.text}
                                        </span>
                                        <span className="text-gray-600">
                                            {option.count} votes ({percentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-800 h-2.5 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className=" w-full md:col-span-2 justify-center">
                    <ShareButton className=" w-full" shareUrl={shareUrl} />
                </div>

                {isCreator && (
                    <div className="md:col-span-2 w-full grid grid-cols-2 gap-6 md:gap-8">
                        <button
                            onClick={togglePollStatus}
                            className={`${
                                pollData.active
                                    ? " bg-gray-600 hover:bg-gray-500"
                                    : "bg-blue-800 hover:bg-blue-700"
                            } text-white py-2  px-4 rounded-md col-span-1 font-semibold shadow `}
                        >
                            {pollData.active ? "Disable" : "Enable"}
                        </button>
                        <button
                            onClick={clearPollVotes}
                            className={`${"bg-gray-600 hover:bg-gray-500"} font-semibold text-white py-2  px-4 rounded-md col-span-1 shadow `}
                        >
                            Reset votes
                        </button>
                    </div>
                )}

                {/* Results Graphs */}
                <div className="bg-white shadow-lg rounded-lg p-6 md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        {pollData?.active ? "Live " : " "}Result Graphs
                    </h2>
                    <div className="mb-4">
                        <label className="mr-2">Graph Type:</label>
                        <select
                            value={chartType}
                            onChange={(e) =>
                                setChartType(e.target.value as "bar" | "pie")
                            }
                            className="border rounded px-2 py-1"
                        >
                            <option value="bar">Bar Chart</option>
                            <option value="pie">Pie Chart</option>
                        </select>
                    </div>

                    {chartType === "bar" ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="votes" fill="#1e40af" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="votes"
                                    nameKey="name"
                                    outerRadius={100}
                                    fill="#8884d8"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    )}

                    <p className="mt-4 text-center">
                        Total Votes:{" "}
                        {pollData?.options.reduce(
                            (sum, option) => sum + option.count,
                            0
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PollComponent;
