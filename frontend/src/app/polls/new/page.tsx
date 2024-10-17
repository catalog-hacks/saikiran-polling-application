"use client";

import CreatePollForm from "@/components/CreatePoll";
import { NextPage } from "next";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

const CreatePollPage: NextPage = () => {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "authenticated") {
            setLoading(false);
        } else if (status === "loading") {
            // Session is still loading, do nothing
        } else {
            redirect("/");
        }
    }, [status]);

    if (loading) {
        return <div>Loading...</div>;
    }

    // If session is available, pass the user ID to PollForm
    const user_id = session?.user?.id;
    const email = session?.user?.email;

    return (
        <div className=" pt-8">
            {user_id && email && (
                <CreatePollForm user_id={user_id} email={email} />
            )}
        </div>
    );
};

export default CreatePollPage;
