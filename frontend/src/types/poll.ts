// poll.ts in /src/types

import { ObjectId } from "mongodb";

export interface Poll {
    id: ObjectId;
    question: string;
    description: string;
    options: Option[];
    created_by: ObjectId;
    created_at: Date;
    votes: Vote[];
    multiple_choices: boolean;
    active: boolean;
}

export interface Option {
    id: ObjectId;
    text: string;
    count: number;
}

export interface Vote {
    userId: ObjectId;
    optionIds: ObjectId[];
    votedAt: Date;
}

export interface UserVote {
    option_ids: string[];
}

export interface PollWithUserVote extends Poll {
    user_vote: UserVote | null;
}
