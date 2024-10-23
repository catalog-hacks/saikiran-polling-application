import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export const POST = async (
    request: Request,
    { params }: { params: { pollId: string } }
) => {
    const { pollId } = params;
    const secret = process.env.AUTH_SECRET;

    const session = await getToken({ req: request, secret });
    const userId = session?.id;
    if (!userId) {
        return NextResponse.json(
            { error: "Unauthorized: No user ID found in session" },
            { status: 401 }
        );
    }

    const { option_ids } = await request.json();

    if (!Array.isArray(option_ids) || option_ids.length === 0) {
        return NextResponse.json(
            { error: "Invalid input: option_ids should be a non-empty array" },
            { status: 400 }
        );
    }

    const backendUrl = process.env.BACKEND_URL;

    try {
        const response = await fetch(`${backendUrl}/polls/${pollId}/vote`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: userId,
                option_ids: option_ids,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to vote: ${response.statusText}`);
        }

        return NextResponse.json({ message: "Vote processed successfully" });
    } catch (error) {
        console.error("Error voting:", error);
        return NextResponse.json(
            { error: "Failed to process vote" },
            { status: 500 }
        );
    }
};
