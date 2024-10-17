import { NextResponse } from "next/server";

export const GET = async (
    request: Request,
    { params }: { params: { pollId: string } }
) => {
    const { pollId } = params;
    const backendUrl = process.env.BACKEND_URL;
    const response = await fetch(`${backendUrl}/polls/${pollId}`, {
        method: "GET",
    });
    const data = await response.json();

    return NextResponse.json({ poll: data });
};
