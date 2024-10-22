import { Suspense } from "react";
import { PollWithUserVote } from "@/types/poll";
import PollComponent from "@/components/Poll";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

async function getPollData(pollId: string): Promise<PollWithUserVote> {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const session = await auth();

    if (!session) {
        try {
            const headersList = headers();
            const currentPath = headersList.get("x-invoke-path") || "";
            const fullUrl = new URL(
                headersList.get("x-invoke-path") || "",
                `http://`
            );
            console.log(fullUrl);
            redirect(`/auth?callbackUrl=${encodeURIComponent(currentPath)}`);
        } catch (error) {
            // Fallback to a default redirect
            redirect("/auth");
        }
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
