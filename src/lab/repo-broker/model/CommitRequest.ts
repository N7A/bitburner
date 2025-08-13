import { CommitType } from "lab/repo-broker/model/CommitType";

export type CommitRequest = {
    data: any;
    type: CommitType;
}