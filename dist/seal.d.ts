import { Transaction } from "@mysten/sui/transactions";
export declare function encryptDataUsingSDK(data: Uint8Array): Promise<Uint8Array<ArrayBufferLike>>;
export declare function decryptDataFromOnChain(encryptedBytes: Uint8Array): Promise<Transaction>;
//# sourceMappingURL=seal.d.ts.map