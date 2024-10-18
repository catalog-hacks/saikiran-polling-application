import { NextResponse } from "next/server";

export const GET = async (
    request: Request,
    { params }: { params: { pollId: string } }
) => {
    const { pollId } = params;

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    const backendUrl = process.env.BACKEND_URL;

    try {
        const response = await fetch(
            `${backendUrl}/polls/${pollId}?userId=${userId}`,
            {
                method: "GET",
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to fetch from backend: ${response.statusText}`
            );
        }

        const data = await response.json();

        return NextResponse.json({ poll: data });
    } catch (error) {
        console.error("Error fetching poll:", error);
        return NextResponse.json(
            { error: "Failed to fetch poll data" },
            { status: 500 }
        );
    }
};
