"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suiAddress = exports.KEY_PAIR = exports.sealClient = exports.suiClient = void 0;
const client_1 = require("@mysten/sui/client");
const seal_1 = require("@mysten/seal");
const ed25519_1 = require("@mysten/sui/keypairs/ed25519");
const constants_1 = require("./constants");
const KEY_PAIR = ed25519_1.Ed25519Keypair.fromSecretKey("suiprivkey1qqgzvw5zc2zmga0uyp4rzcgk42pzzw6387zqhahr82pp95yz0scscffh2d8");
exports.KEY_PAIR = KEY_PAIR;
const suiClient = new client_1.SuiClient({
    url: (0, client_1.getFullnodeUrl)("testnet"),
});
exports.suiClient = suiClient;
const sealClient = new seal_1.SealClient({
    suiClient: suiClient,
    serverConfigs: constants_1.KEY_SERVER_LIST_TESTNET.map((id) => ({
        objectId: id,
        weight: 1,
    })),
    verifyKeyServers: true,
});
exports.sealClient = sealClient;
const suiAddress = KEY_PAIR.getPublicKey().toSuiAddress();
exports.suiAddress = suiAddress;
//# sourceMappingURL=client.js.map