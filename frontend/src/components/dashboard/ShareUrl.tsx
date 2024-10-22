import React, { useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const ShareButton = ({
    shareUrl,
    className,
}: {
    shareUrl: string;
    className?: string;
}) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy: ", error);
        }
    };

    return (
        <Button
            variant={"outline"}
            className={cn("w-36", className)}
            onClick={handleCopy}
            type="button"
            aria-label={isCopied ? "Link copied!" : "Share poll"}
        >
            {isCopied ? "Link Copied!" : "Share Poll"}
        </Button>
    );
};

export default ShareButton;
