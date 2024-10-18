import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    const { email } = await request.json();
    const backendUrl = process.env.BACKEND_URL;
    const response = await fetch(`${backendUrl}/login/begin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();

    return NextResponse.json({ data, status: response.status });
};
