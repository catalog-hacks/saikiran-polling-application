import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    const { name, email } = await request.json();
    const backendUrl = process.env.BACKEND_URL;

    const response = await fetch(`${backendUrl}/register/begin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
    });

    const data = await response.json();

    return NextResponse.json({
        data,
        status: response.status,
    });
};
