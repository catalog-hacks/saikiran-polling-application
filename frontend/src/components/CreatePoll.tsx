import { usePasskeyAuth } from "@/hooks/usePasskeyAuth";
import React, { useState } from "react";
import ShareButton from "./dashboard/ShareUrl";
import Link from "next/link";

interface PollFormData {
    question: string;
    options: string[];
    multiple_choices: boolean;
}

interface CreatePollFormProps {
    user_id: string;
    email: string;
}

const CreatePollForm: React.FC<CreatePollFormProps> = ({ user_id, email }) => {
    const [pollData, setPollData] = useState<PollFormData>({
        question: "",
        options: ["", ""], // Starting with two options as default
        multiple_choices: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { verifyPasskey } = usePasskeyAuth();
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setPollData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...pollData.options];
        newOptions[index] = value;
        setPollData((prev) => ({
            ...prev,
            options: newOptions,
        }));
    };

    const addOption = () => {
        setPollData((prev) => ({
            ...prev,
            options: [...prev.options, ""], // Add a new empty option
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        // Validate poll data
        if (
            !pollData.question.trim() ||
            pollData.options.length < 2 ||
            pollData.options.some((opt) => !opt.trim())
        ) {
            setError(
                "Please fill in the question and provide at least two options."
            );
            setIsSubmitting(false);
            return;
        }

        try {
            // Verify passkey before proceeding
            const isVerified = await verifyPasskey(email); // Pass the user's email

            if (!isVerified) {
                setError("Passkey verification failed.");
                setIsSubmitting(false);
                return;
            }

            // If passkey verification is successful, proceed with poll creation
            const response = await fetch("/api/polls", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...pollData,
                    user_id, // Attach the user ID from session
                }),
            });

            const data = await response.json();
            console.log(data);
            setShareUrl(`${frontendUrl}/polls/${data.poll.id}`);
            if (response.ok) {
                setSuccess("Poll created successfully!");
                setPollData({
                    question: "",
                    options: ["", ""],
                    multiple_choices: false,
                }); // Reset the form
            } else {
                setError(data.message || "Failed to create poll.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
                Create a New Poll
            </h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                        Question:
                        <textarea
                            name="question"
                            value={pollData.question}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
                            rows={3}
                        />
                    </label>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-700">
                        Options:
                    </h3>
                    {pollData.options.map((option, index) => (
                        <div key={index} className="mt-2">
                            <label className="block">
                                <span className="text-gray-700">
                                    Option {index + 1}:
                                </span>
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) =>
                                        handleOptionChange(
                                            index,
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
                                />
                            </label>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addOption}
                        className="mt-4 bg-blue-800 text-white py-2 px-4 rounded-md w-full hover:bg-blue-700"
                    >
                        Add Option
                    </button>
                </div>

                <div className="mb-4">
                    <label className="inline-flex items-center text-gray-700">
                        <input
                            type="checkbox"
                            name="multiple_choice"
                            checked={pollData.multiple_choices}
                            onChange={(e) =>
                                setPollData((prev) => ({
                                    ...prev,
                                    multiple_choices: e.target.checked,
                                }))
                            }
                            className="h-4 w-4 text-blue-800 border-gray-300 rounded focus:ring-2 focus:ring-blue-800"
                        />
                        <span className="ml-2">Allow multiple choices</span>
                    </label>
                </div>

                <div className="mb-6">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full bg-blue-800 text-white py-2 px-4 rounded-md ${
                            isSubmitting
                                ? "cursor-not-allowed opacity-50"
                                : "hover:bg-blue-700"
                        }`}
                    >
                        {isSubmitting ? "Creating..." : "Create Poll"}
                    </button>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && shareUrl && (
                    <div className=" flex justify-between items-center">
                        <div className="text-green-500 text-sm">
                            <span>{success}</span>{" "}
                            <Link href={shareUrl}>
                                <span className=" hover:underline">
                                    Go to poll
                                </span>
                            </Link>
                        </div>
                        <ShareButton shareUrl={shareUrl} />
                    </div>
                )}
            </form>
        </div>
    );
};

export default CreatePollForm;
