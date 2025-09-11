import { getPortPrograms } from 'workspace/resource-generator/hacking/model/PortProgram';

/**
 * @requires singularity
 */
export async function main(ns: NS) {
    const input: InputArg = await getInput(ns);

    ns.singularity.purchaseProgram(input.targetProgram);
}

//#region Input parameters
type InputArg = {
    /** Programme cible */
    targetProgram: string;
}

/**
 * Load input parameters
 * @param ns Bitburner API
 * @returns 
 */
 async function getInput(ns: NS): Promise<InputArg> {
     let targetProgram: string;
     if (ns.args[0] === undefined) {
         targetProgram = await ns.prompt('Merci de renseigner un programme', { 
            type: "select", choices: getPortPrograms(ns).map(x => x.filename) 
        }) as string
     } else {
         targetProgram = (ns.args[0] as string);
     }
 
     return {
        targetProgram: targetProgram
     };
 }
//#endregion Input parameters
