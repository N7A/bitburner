
import { CommitRequest } from "lab/repo-broker/model/CommitRequest";
import { CommitType } from "lab/repo-broker/model/CommitType";
import { PORT as COMMIT_HANDLER_PORT } from "/lab/repo-broker/commit-handler";

//#region Constants
const COMMIT_HANDLER = "workspace/domain/targets/commit-handler.ts";
//#endregion Constants

export async function addScan(ns: NS, hostnames: string[]) {
    const commitRequest: CommitRequest = {
        data: hostnames, 
        type: CommitType.ADD_SCAN
    };

    while(!ns.tryWritePort(COMMIT_HANDLER_PORT, commitRequest)) {
        await ns.asleep(500);
    }

    if (!ns.isRunning(COMMIT_HANDLER)) {
        ns.run(COMMIT_HANDLER);
    }
}
