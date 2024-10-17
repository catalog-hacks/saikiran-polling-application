import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    try {
        const { userId, data } = await request.json();
        const backendUrl = process.env.BACKEND_URL;

        const response = await fetch(`${backendUrl}/register/finish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, data }),
        });

        const responseBody = await response.text(); // Get the response body as text for logging

        console.log("Response from Go server:", responseBody); // Log the response from Go server

        return new NextResponse(responseBody, {
            status: response.status,
        });
    } catch (err: any) {
        return new NextResponse(`Error: ${err.message}`, { status: 500 });
    }
};
