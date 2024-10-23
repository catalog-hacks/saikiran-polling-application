import AllPolls from "@/components/AllPolls";
import { Suspense } from "react";

export default async function PollsPage({
    searchParams,
}: {
    searchParams?: {
        status?: string;
        page?: string;
    };
}) {
    const status = searchParams?.status || "all";
    const page = Number(searchParams?.page) || 1;
    const pollsData = await fetchPolls(status, page);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">All Polls</h1>
            <Suspense fallback={<PollsLoading />}>
                <AllPolls initialData={pollsData} />
            </Suspense>
        </div>
    );
}

function PollsLoading() {
    return (
        <div className="space-y-6">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="animate-pulse bg-gray-200 rounded-lg h-32"
                />
            ))}
        </div>
    );
}

export async function fetchPolls(
    status: string,
    page: number,
    limit: number = 10
) {
    const response = await fetch(
        `${process.env.BACKEND_URL}/polls?status=${status}&page=${page}&limit=${limit}`,
        {
            // This ensures fresh data on each request
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch polls");
    }

    return response.json();
}
