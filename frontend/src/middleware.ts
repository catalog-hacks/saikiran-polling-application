import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function middleware(request: NextRequest) {
    const session = await auth();
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/auth") || pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    if (!session) {
        const url = new URL("/auth", request.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Routes that need protection
        "/polls/:path*",
    ],
};
