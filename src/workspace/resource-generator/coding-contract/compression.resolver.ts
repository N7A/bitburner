import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';
import * as Log from 'workspace/socle/utils/logging';

export async function main(ns: NS) {
    const resolver: CompressionResolver = new CompressionResolver(ns);
    
    await resolver.run();
}

class CompressionResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.CompressionIRLECompression,
                ns.enums.CodingContractName.CompressionIILZDecompression
            ]
        );
    }

    protected getSolution(codingContract: CodingContractObject): string {

        if (codingContract.type === this.ns.enums.CodingContractName.CompressionIRLECompression) {
            return this.getSolutionI(codingContract);
        } else if (codingContract.type === this.ns.enums.CodingContractName.CompressionIILZDecompression) {
            return this.getSolutionII(codingContract);
        }

        this.logger.err(`Type (${codingContract}) non pris en charge`);
    }

    /**
     * Description : Run-length encoding (RLE) is a data compression technique which encodes data as a series of runs of a repeated single character. 
     * Runs are encoded as a length, followed by the character itself. 
     * Lengths are encoded as a single ASCII digit; runs of 10 characters or more are encoded by splitting them into multiple runs.
     * 
     * You are given the following input string: vvFFFFFFFFFjBBssxxRrBBBBRRqqRRBBffffffffffff3322200VVVVqqqqqqqqqqqiimUvvv
     * Encode it using run-length encoding with the minimum possible output length.
     * 
     * Examples:
     * aaaaabccc            ->  5a1b3c
     * aAaAaA               ->  1a1A1a1A1a1A
     * 111112333            ->  511233
     * zzzzzzzzzzzzzzzzzzz  ->  9z9z1z  (or 9z8z2z, etc.)
     */
    private getSolutionI(codingContract: CodingContractObject): string {
        const data: string = codingContract.data as string;
        this.logger.trace(Log.INFO('Données', data));

        let result: string = '';

        for (let index = 0; index < data.length; index++) {
            const element: string = data[index];
            const length: number = this.getLength(data.substring(index));
            result += length + element;
            index += length-1;
        }

        return result;
    }
    
    /**
     * Description : Lempel-Ziv (LZ) compression is a data compression technique which encodes data using references to earlier parts of the data. 
     * In this variant of LZ, data is encoded in two types of chunk. 
     * Each chunk begins with a length L, encoded as a single ASCII digit from 1 to 9, followed by the chunk data, which is either:
     * 
     * 1. Exactly L characters, which are to be copied directly into the uncompressed data.
     * 2. A reference to an earlier part of the uncompressed data. 
     * To do this, the length is followed by a second ASCII digit X: each of the L output characters is a copy of the character X places before it in the uncompressed data.
     * 
     * For both chunk types, a length of 0 instead means the chunk ends immediately, and the next character is the start of a new chunk. 
     * The two chunk types alternate, starting with type 1, and the final chunk may be of either type.
     * 
     * You are given the following LZ-encoded string:
     * 8dqUCAt5476816fAt56K866465Y7y958ZRrZRhyA722EH
     * 
     * Decode it and output the original string.
     * 
     * Example: decoding '5aaabb450723abb' chunk-by-chunk
     * 5aaabb           ->  aaabb
     * 5aaabb45         ->  aaabbaaab
     * 5aaabb450        ->  aaabbaaab
     * 5aaabb45072      ->  aaabbaaababababa
     * 5aaabb450723abb  ->  aaabbaaababababaabb
     * 
     * @param codingContract 
     * @returns 
     */
    private getSolutionII(codingContract: CodingContractObject): string {
        const data: string = codingContract.data as string;
        this.logger.trace(Log.INFO('Données', data));

        let result: string = '';

        let currentType = ChunkType.RAW;
        for (let index = 0; index < data.length; index++) {
            const length: number = Number(data[index]);
            
            let chunk: Chunk;
            if (currentType == ChunkType.RAW) {
                // switch type
                currentType = ChunkType.REFERENCE;

                if (length === 0) {
                    continue;
                }

                const startIndex = index + 1;
                chunk = new RawChunk(length, data.substring(startIndex, startIndex + length));
            } else if (currentType == ChunkType.REFERENCE) {
                // switch type
                currentType = ChunkType.RAW;

                if (length === 0) {
                    continue;
                }
                
                chunk = new ReferenceChunk(length, Number(data[index+1]), result);
            }

            // decompress
            result += chunk.getDecompress();
            // on avance le curseur
            index += chunk.getLength() - 1;
        }

        return result;
    }
    
    private getLength(data: string): number {
        const MAX_LENGTH = 9;

        let index = 0;
        const currentChar = data[index];
        while (index < Math.min(MAX_LENGTH, data.length) && currentChar === data[index]) {
            index++;
        } 

        return index;
    }

}

enum ChunkType {
    RAW,
    REFERENCE
}

interface Chunk {
    getLength(): number;
    getDecompress(): string;
}

class RawChunk implements Chunk {
    length: number;
    raw: string;

    constructor(length: number, raw: string) {
        this.length = length;
        this.raw = raw;
    }

    getLength(): number {
        return 1 + this.length;
    }

    getDecompress(): string {
        return this.raw;
    }
}

class ReferenceChunk implements Chunk {
    length: number;
    reference: number;
    private currentDecompress: string;
    
    constructor(length: number, reference: number, currentDecompress: string) {
        this.length = length;
        this.reference = reference;
        this.currentDecompress = currentDecompress;
    }
    
    getLength(): number {
        return 2;
    }
    
    getDecompress(): string {
        let result: string = '';

        const startIndex = this.currentDecompress.length - this.reference;
        const motif = this.currentDecompress.substring(startIndex);

        // decompress
        let lengthWrote: number = 0;
        while (lengthWrote < this.length) {
            const currentLengthWrote: number = Math.min(this.length - lengthWrote, motif.length)
            result += motif.substring(0, currentLengthWrote);
            lengthWrote += currentLengthWrote;
        }

        return result;
    }
}