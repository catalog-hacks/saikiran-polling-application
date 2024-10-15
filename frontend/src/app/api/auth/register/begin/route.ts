import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    const { name, email } = await request.json();

    console.log("Registration begin Proxy API called");

    const response = await fetch("http://localhost:8080/register/begin", {
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
