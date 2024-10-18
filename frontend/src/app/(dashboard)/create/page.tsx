"use client";

import CreatePollForm from "@/components/CreatePoll";
import { NextPage } from "next";
import { useSessionStore } from "@/store/useSessionStore";
import { useShallow } from "zustand/shallow";

const CreatePollPage: NextPage = () => {
    const [user_id, email] = useSessionStore(
        useShallow((state) => [state.user_id, state.email])
    );

    return (
        <div className="pt-8">
            {user_id && email && (
                <CreatePollForm user_id={user_id} email={email} />
            )}
        </div>
    );
};

export default CreatePollPage;
