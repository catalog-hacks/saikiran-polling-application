import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    const { email, data } = await request.json();
    const backendUrl = process.env.BACKEND_URL;
    const response = await fetch(`${backendUrl}/login/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, data }),
    });

    return new NextResponse(null, {
        status: response.status,
    });
};
