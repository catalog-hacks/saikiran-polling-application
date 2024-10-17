// poll.ts in /src/types

import { ObjectId } from "mongodb";

export interface Poll {
    id: ObjectId;
    question: string;
    options: Option[];
    createdBy: ObjectId;
    createdAt: Date;
    votes: Vote[];
    multipleChoices: boolean;
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
