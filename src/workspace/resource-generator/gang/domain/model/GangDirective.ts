import { WantedLvl } from "workspace/resource-generator/gang/domain/model/WantedLvl";
import { TaskType } from "workspace/resource-generator/gang/model/TaskType";

export type GangDirective = {
    tasksWeight: Map<TaskType, number> | Object;
    wantedLvl: WantedLvl;
}