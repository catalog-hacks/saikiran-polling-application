import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    const { question, description, options, user_id, multiple_choices } =
        await request.json();
    const backendUrl = process.env.BACKEND_URL;
    const response = await fetch(`${backendUrl}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            question,
            description,
            options,
            user_id,
            multiple_choices,
        }),
    });

    const data = await response.json();

    return NextResponse.json({
        poll: data,
        status: response.status,
    });
};
