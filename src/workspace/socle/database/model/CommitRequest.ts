import { Repository } from "workspace/socle/database/model/Repository";
import { CommitType } from "workspace/socle/database/model/CommitType";

export type CommitRequest = {
    data: any;
    type: CommitType;
    repository: Repository;
}