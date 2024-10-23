// app/polls/user/page.tsx
import { auth } from "@/auth";
import PollsList from "@/components/dashboard/PollList";
import { Poll } from "@/types/poll";
import { Suspense } from "react";

async function getUserPolls(): Promise<Poll[]> {
    const session = await auth();
    const response = await fetch(
        `${process.env.BACKEND_URL}/userpolls?userId=${session?.user?.id}`,
        {
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch polls");
    }

    const data = await response.json();
    return data;
}

export default async function UserPollsPage() {
    const polls = await getUserPolls();

    return (
        <Suspense fallback={<PollsLoadingUI />}>
            <div className="mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">
                    Your Polls
                </h1>
                <PollsList initialPolls={polls} />
            </div>
        </Suspense>
    );
}

function PollsLoadingUI() {
    return (
        <div className="mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
                Your Polls
            </h1>
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="animate-pulse bg-gray-200 rounded-lg h-32"
                    />
                ))}
            </div>
        </div>
    );
}
