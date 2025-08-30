"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcs_1 = require("@mysten/bcs");
const seal_1 = require("@mysten/seal");
const transactions_1 = require("@mysten/sui/transactions");
const constants_1 = require("./constants");
const ed25519_1 = require("@mysten/sui/keypairs/ed25519");
const client_1 = require("@mysten/sui/client");
const client_2 = require("@mysten/sui/client");
(async () => {
    var _a;
    const keyPair = ed25519_1.Ed25519Keypair.fromSecretKey("suiprivkey1qqgzvw5zc2zmga0uyp4rzcgk42pzzw6387zqhahr82pp95yz0scscffh2d8");
    const suiAddress = keyPair.getPublicKey().toSuiAddress();
    const suiClient = new client_2.SuiClient({
        url: (0, client_1.getFullnodeUrl)("testnet"),
    });
    const sealClient = new seal_1.SealClient({
        suiClient: suiClient,
        serverConfigs: constants_1.KEY_SERVER_LIST_TESTNET.map((id) => ({
            objectId: id,
            weight: 1,
        })),
        verifyKeyServers: true,
    });
    const constructTxBytes = async (tx, packageId, module, client, args) => {
        tx.moveCall({
            target: `${packageId}::${module}::seal_approve`,
            arguments: [tx.pure.vector("u8", (0, bcs_1.fromHex)(args[0])), tx.object(args[0])],
        });
        return tx.build({ client: suiClient, onlyTransactionKind: true });
    };
    const sessionKey = await seal_1.SessionKey.create({
        address: suiAddress,
        packageId: constants_1.TESTNET_PACKAGES.ID,
        ttlMin: 10,
        signer: keyPair,
        suiClient,
    });
    //   const txBytes = await constructTxBytes(TESTNET_PACKAGES.ID, "allowlist", suiClient, [TESTNET_PACKAGES.WHITELIST_ID]);
    let publicKeys = await sealClient.getPublicKeys(constants_1.KEY_SERVER_LIST_TESTNET);
    console.log("publicKeysssssssssss", publicKeys);
    let publicKeysList = publicKeys.map((p) => p.toBytes());
    console.log("publicKeys", publicKeysList);
    const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
        threshold: 2,
        packageId: constants_1.TESTNET_PACKAGES.ID,
        id: constants_1.TESTNET_PACKAGES.WHITELIST_ID,
        demType: 1,
        kemType: 0,
        data: new Uint8Array([1, 2, 3]),
    });
    console.warn("Encrypted Bytes", encryptedBytes);
    const encryptedObjectInformation = seal_1.EncryptedObject.parse(encryptedBytes);
    console.warn("Encrypted Object", encryptedObjectInformation);
    console.log("OKAY THE ENCRYPTION IS DONE!!");
    const tx1 = new transactions_1.Transaction();
    const txBytes = await constructTxBytes(tx1, constants_1.TESTNET_PACKAGES.ID, "allowlist", suiClient, [constants_1.TESTNET_PACKAGES.WHITELIST_ID]);
    console.log("Hold tight... Getting the Derived keys...");
    const keyServers = await sealClient.getKeyServers();
    console.log("keyServers", keyServers);
    console.log("keyServers", keyServers);
    const derivedKeys = await sealClient.getDerivedKeys({
        id: constants_1.TESTNET_PACKAGES.WHITELIST_ID,
        txBytes,
        sessionKey,
        threshold: 2,
    });
    console.log("Derived keys are ready!!");
    const tx = tx1;
    const [id0, id1] = constants_1.KEY_SERVER_LIST_TESTNET;
    if (!id0 || !id1) {
        throw new Error("KEY_SERVER_LIST_TESTNET must contain at least two entries");
    }
    const derivedKey0 = derivedKeys.get(id0);
    const derivedKey1 = derivedKeys.get(id1);
    if (!derivedKey0 || !derivedKey1) {
        throw new Error("Missing derived keys for one or more key servers");
    }
    const derivedKeysList = [
        Array.from(derivedKey0.key.toBytes()),
        Array.from(derivedKey1.key.toBytes()),
    ];
    console.log("derivedKeysList", derivedKeysList);
    //START: Getting the public keys for the key servers -->
    console.log("Getting the public keys for the key servers...");
    console.log("KEY_SERVER_LIST_TESTNET[0]", constants_1.KEY_SERVER_LIST_TESTNET[0]);
    console.log("publicKeysList[0]", publicKeysList[0]);
    console.log("KEY_SERVER_LIST_TESTNET[1]", constants_1.KEY_SERVER_LIST_TESTNET[1]);
    console.log("publicKeysList[1]", publicKeysList[1]);
    console.log("Verified derived keys are ready!!");
    //END: Getting the verified derived keys for the derived keys -->
    const encryptedObject = tx.moveCall({
        target: `${constants_1.TESTNET_PACKAGES.SEAL_PACKAGE_ID}::bf_hmac_encryption::parse_encrypted_object`,
        arguments: [tx.pure.vector("u8", Array.from(encryptedBytes))],
    });
    console.log("Encrypted object is ready!!");
    tx.moveCall({
        target: `${constants_1.TESTNET_PACKAGES.SEAL_PACKAGE_ID}::bf_hmac_encryption::decrypt`,
        arguments: [
            encryptedObject,
            tx.pure.vector("id", [id0, id1]),
            tx.pure.vector("vector<u8>", Array.from(publicKeysList)),
            tx.pure.vector("vector<u8>", derivedKeysList),
        ],
    });
    console.log("Decrypting the encrypted object...");
    // tx.moveCall({
    //   target: `${TESTNET_PACKAGES.SEAL_PACKAGE_ID}::bf_hmac_encryption::decrypt`,
    //   arguments: [
    //     tx.object(encryptedObject),
    //     tx.pure.vector("u8", derivedKeysList),
    //     tx.pure.address(TESTNET_PACKAGES.ID),
    //     tx.pure.vector("u8", fromHex(TESTNET_PACKAGES.WHITELIST_ID)),
    //     tx.pure.vector("id", [KEY_SERVER_LIST_TESTNET[0], KEY_SERVER_LIST_TESTNET[1]]),
    //     tx.pure.vector("u8", Array.from(publicKeysList) as any),
    //   ],
    // });
    const result = await suiClient.signAndExecuteTransaction({
        signer: keyPair,
        transaction: tx,
        options: {
            showEffects: true,
            showObjectChanges: true,
        },
    });
    await suiClient.waitForTransaction({
        digest: result.digest,
        options: {
            showEffects: true,
            showInput: false,
            showEvents: false,
            showObjectChanges: true,
            showBalanceChanges: false,
        },
    });
    const txn = await suiClient.waitForTransaction({
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
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=encrypt.js.map