import { Contract } from "../../model/Contract";

export type FailedContract = {
    contrat: Contract;
    data: CodingContractObject;
    errorMessage: string;
}