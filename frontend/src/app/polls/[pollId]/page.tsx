// app/polls/[pollId]/page.tsx
import { Suspense } from "react";
import { PollWithUserVote } from "@/types/poll";
import PollComponent from "@/components/Poll";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

async function getPollData(pollId: string): Promise<PollWithUserVote> {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const session = await auth();
    if (!session) {
        redirect("/auth");
    }
    const res = await fetch(
        `${backendUrl}/polls/${pollId}?userId=${session?.user?.id}`,
        {
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!res.ok) {
        throw new Error("Failed to fetch poll");
    }

    const data = await res.json();
    return data;
}

export default async function PollPage({
    params,
}: {
    params: { pollId: string };
}) {
    const initialPollData = await getPollData(params.pollId);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PollComponent
                initialPollData={initialPollData}
                pollId={params.pollId}
            />
        </Suspense>
    );
}
