import { cn } from "@/utils/cn";
import React, { useState } from "react";

const ShareButton = ({
    shareUrl,
    className,
}: {
    shareUrl: string;
    className?: string;
}) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy: ", error);
        }
    };

    return (
        <button
            className={cn(
                ` border-gray-800 text-gray-800 border-2 font-semibold py-2 px-4 rounded-md w-36 bg-gray-50 hover:bg-white duration-300 focus:outline-none`,
                className
            )}
            onClick={handleCopy}
            type="button"
            aria-label={isCopied ? "Link copied!" : "Share poll"}
        >
            {isCopied ? "Link Copied!" : "Share Poll"}
        </button>
    );
};

export default ShareButton;
