import { CommitType } from "workspace/domain/targets/model/CommitType";

export type CommitRequest = {
    data: any;
    type: CommitType;
}