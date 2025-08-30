import { SuiClient } from "@mysten/sui/client";
import { SealClient } from "@mysten/seal";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
declare const KEY_PAIR: Ed25519Keypair;
declare const suiClient: SuiClient;
declare const sealClient: SealClient;
declare const suiAddress: string;
export { suiClient, sealClient, KEY_PAIR, suiAddress };
//# sourceMappingURL=client.d.ts.map