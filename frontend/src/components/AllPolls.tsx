"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Poll, PollsResponse } from "@/types/poll";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePathname } from "next/navigation";
import PollCard from "./PollCard";

interface PollsClientProps {
    initialData: PollsResponse;
}

export default function AllPolls({ initialData }: PollsClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams);
            params.set(name, value);
            return params.toString();
        },
        [searchParams]
    );

    const currentStatus = searchParams.get("status") || "all";
    const currentPage = Number(searchParams.get("page")) || 1;

    const handleStatusChange = (value: string) => {
        router.push(`${pathname}?${createQueryString("status", value)}&page=1`);
    };

    const handlePageChange = (page: number) => {
        router.push(
            `${pathname}?${createQueryString(
                "page",
                page.toString()
            )}&status=${currentStatus}`
        );
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
                <Select
                    value={currentStatus}
                    onValueChange={handleStatusChange}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Polls</SelectItem>
                        <SelectItem value="active">Active Polls</SelectItem>
                        <SelectItem value="closed">Closed Polls</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Polls List */}
            <div className="flex flex-col space-y-8">
                {initialData.polls.length === 0 ? (
                    <p className="text-center text-gray-500">No polls found.</p>
                ) : (
                    initialData.polls.map((poll) => (
                        <PollCard key={poll.id.toString()} poll={poll} />
                    ))
                )}
            </div>

            {/* Pagination */}
            {initialData.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-2">
                        {Array.from(
                            { length: initialData.totalPages },
                            (_, i) => i + 1
                        ).map((page) => (
                            <Button
                                key={page}
                                variant={
                                    page === currentPage ? "default" : "outline"
                                }
                                onClick={() => handlePageChange(page)}
                                className="w-10"
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === initialData.totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
