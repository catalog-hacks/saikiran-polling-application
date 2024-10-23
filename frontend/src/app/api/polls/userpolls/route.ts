import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(req) {
    if (!req.auth) {
        return NextResponse.json(
            { message: "Not authenticated" },
            { status: 401 }
        );
    }

    const userId = req.auth.user?.id;

    if (!userId) {
        return NextResponse.json(
            { message: "User ID is missing" },
            { status: 400 }
        );
    }

    const backendUrl = process.env.BACKEND_URL;

    try {
        const response = await fetch(
            `${backendUrl}/userpolls?userId=${userId}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch polls from backend API");
        }

        const data = await response.json();

        return NextResponse.json({
            polls: data,
            status: response.status,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json(
                { message: error.message },
                { status: 500 }
            );
        }
        return NextResponse.json(
            { message: "Unknown error occurred" },
            { status: 500 }
        );
    }
});
