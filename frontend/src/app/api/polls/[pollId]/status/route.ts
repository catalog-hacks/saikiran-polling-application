import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export const PUT = async (
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

    const { active } = await request.json();

    if (typeof active !== "boolean") {
        return NextResponse.json(
            { error: "Invalid input: active should be a boolean" },
            { status: 400 }
        );
    }

    const backendUrl = process.env.BACKEND_URL;

    try {
        const response = await fetch(`${backendUrl}/polls/${pollId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId,
                active: active,
            }),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to update poll status: ${response.statusText}`
            );
        }

        return NextResponse.json({
            message: "Poll status updated successfully",
        });
    } catch (error) {
        console.error("Error updating poll status:", error);
        return NextResponse.json(
            { error: "Failed to process poll status update" },
            { status: 500 }
        );
    }
};
