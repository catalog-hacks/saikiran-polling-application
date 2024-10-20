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
                `bg-green-600 text-white py-2 px-4 rounded-md w-36 hover:bg-green-500 focus:outline-none`,
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
