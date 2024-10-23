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

    const backendUrl = process.env.BACKEND_URL;

    try {
        const response = await fetch(
            `${backendUrl}/polls/${pollId}/clear-votes`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to clear poll votes: ${response.statusText}`
            );
        }

        return NextResponse.json({
            message: "Poll votes cleared successfully",
        });
    } catch (error) {
        console.error("Error clearing poll votes:", error);
        return NextResponse.json(
            { error: "Failed to process clear votes request" },
            { status: 500 }
        );
    }
};
