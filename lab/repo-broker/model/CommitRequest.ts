import { CommitType } from "/lab/model/CommitType";

export type CommitRequest = {
    data: any;
    type: CommitType;
}