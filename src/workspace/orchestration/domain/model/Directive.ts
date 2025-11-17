import { ResourceType } from "workspace/common/model/Resource"

export type Directive = {
    // liste des ressources recherchées par ordre de priorité
    priorite: ResourceType[]
} 