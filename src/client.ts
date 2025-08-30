import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { SealClient } from "@mysten/seal";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { KEY_SERVER_LIST_TESTNET } from "./constants";

const KEY_PAIR = Ed25519Keypair.fromSecretKey("suiprivkey1qqgzvw5zc2zmga0uyp4rzcgk42pzzw6387zqhahr82pp95yz0scscffh2d8");
const suiClient = new SuiClient({
  url: getFullnodeUrl("testnet"),
});

const sealClient = new SealClient({
  suiClient: suiClient as any,
  serverConfigs: KEY_SERVER_LIST_TESTNET.map((id: string) => ({
    objectId: id,
    weight: 1,
  })),
  verifyKeyServers: true,
});
const suiAddress = KEY_PAIR.getPublicKey().toSuiAddress();

export { suiClient, sealClient, KEY_PAIR, suiAddress };
