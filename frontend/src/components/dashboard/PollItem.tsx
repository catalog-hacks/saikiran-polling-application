import { Poll } from "@/types/poll";
import ShareButton from "./ShareUrl";
import Link from "next/link";

const PollItem = ({ poll }: { poll: Poll }) => {
    const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
    const shareUrl = `${frontendUrl}/polls/${poll.id}`;

    const dateOptions: Intl.DateTimeFormatOptions = {
        formatMatcher: "best fit",
        dateStyle: "full",
        timeZone: "IST",
    };

    return (
        <div className="p-4 bg-gray-100 rounded-md shadow">
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

            <div className="mt-4 flex justify-end space-x-4">
                <ShareButton shareUrl={shareUrl} />
                <button className="bg-blue-500 text-white py-2 w-36 px-4 rounded-md hover:bg-blue-600">
                    Manage Poll
                </button>
            </div>
        </div>
    );
};

export default PollItem;
