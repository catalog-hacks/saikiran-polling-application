import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    const { email } = await request.json();

    const response = await fetch("http://localhost:8080/login/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();

    return NextResponse.json({ data, status: response.status });
};
