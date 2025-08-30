"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
const seal_1 = require("./seal");
async function main() {
    var _a;
    const encryptedBytes = await (0, seal_1.encryptDataUsingSDK)(new Uint8Array([1, 2, 3]));
    console.log("Encrypted Bytes", encryptedBytes);
    const tx = await (0, seal_1.decryptDataFromOnChain)(encryptedBytes);
    const result = await client_1.suiClient.signAndExecuteTransaction({
        signer: client_1.KEY_PAIR,
        transaction: tx,
        options: {
            showEffects: true,
            showObjectChanges: true,
        },
    });
    await client_1.suiClient.waitForTransaction({
        digest: result.digest,
        options: {
            showEffects: true,
            showInput: false,
            showEvents: false,
            showObjectChanges: true,
            showBalanceChanges: false,
        },
    });
    const txn = await client_1.suiClient.waitForTransaction({
        digest: result.digest,
        options: {
            showEffects: true,
            showInput: false,
            showEvents: true,
            showObjectChanges: true,
            showBalanceChanges: false,
        },
    });
    console.log(result.digest);
    (_a = txn.events) === null || _a === void 0 ? void 0 : _a.forEach((event) => {
        console.log(event);
    });
}
main();
//# sourceMappingURL=index.js.map