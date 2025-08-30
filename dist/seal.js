"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptDataUsingSDK = encryptDataUsingSDK;
exports.decryptDataFromOnChain = decryptDataFromOnChain;
const bcs_1 = require("@mysten/bcs");
const seal_1 = require("@mysten/seal");
const transactions_1 = require("@mysten/sui/transactions");
const constants_1 = require("./constants");
const client_1 = require("./client");
async function encryptDataUsingSDK(data) {
    console.log("Encrypting data using SDK");
    //check if key server list is correct
    console.log("KEY_SERVER_LIST_TESTNET", constants_1.KEY_SERVER_LIST_TESTNET);
    //checking key servers of seal client
    const keyServers = await client_1.sealClient.getKeyServers();
    console.log("Key Servers", keyServers);
    const { encryptedObject: encryptedBytes } = await client_1.sealClient.encrypt({
        threshold: 2,
        packageId: constants_1.TESTNET_PACKAGES.ID,
        id: constants_1.TESTNET_PACKAGES.WHITELIST_ID,
        demType: 1,
        kemType: 0,
        data,
    });
    return encryptedBytes;
}
async function constructTxBytes(tx, packageId, module, client, args) {
    tx.moveCall({
        target: `${packageId}::${module}::seal_approve`,
        arguments: [tx.pure.vector("u8", (0, bcs_1.fromHex)(args[0])), tx.object(args[0])],
    });
    return tx.build({ client: client_1.suiClient, onlyTransactionKind: true });
}
async function decryptDataFromOnChain(encryptedBytes) {
    const tx = new transactions_1.Transaction();
    const txBytes = await constructTxBytes(tx, constants_1.TESTNET_PACKAGES.ID, "allowlist", client_1.suiClient, [constants_1.TESTNET_PACKAGES.WHITELIST_ID]);
    let publicKeys = await client_1.sealClient.getPublicKeys(constants_1.KEY_SERVER_LIST_TESTNET);
    let publicKeysList = publicKeys.map((p) => p.toBytes());
    console.log("publicKeys", publicKeysList);
    const sessionKey = await seal_1.SessionKey.create({
        address: client_1.suiAddress,
        packageId: constants_1.TESTNET_PACKAGES.ID,
        ttlMin: 10,
        signer: client_1.KEY_PAIR,
        suiClient: client_1.suiClient,
    });
    const derivedKeys = await client_1.sealClient.getDerivedKeys({
        id: constants_1.TESTNET_PACKAGES.WHITELIST_ID,
        txBytes,
        sessionKey,
        threshold: 2,
    });
    console.log("Derived keys are ready!!");
    const encryptedObjectInformation = seal_1.EncryptedObject.parse(encryptedBytes);
    console.warn("Encrypted Object", encryptedObjectInformation);
    const [id0, id1] = constants_1.KEY_SERVER_LIST_TESTNET;
    if (!id0 || !id1) {
        throw new Error("KEY_SERVER_LIST_TESTNET must contain at least two entries");
    }
    const derivedKey0 = derivedKeys.get(id0);
    const derivedKey1 = derivedKeys.get(id1);
    const derivedKeysList = [Array.from(derivedKey0.key.toBytes()), Array.from(derivedKey1.key.toBytes())];
    console.log("derivedKeysList", derivedKeysList);
    const encryptedObject = tx.moveCall({
        target: `${constants_1.TESTNET_PACKAGES.SEAL_PACKAGE_ID}::bf_hmac_encryption::parse_encrypted_object`,
        arguments: [tx.pure.vector("u8", Array.from(encryptedBytes))],
    });
    console.log("Encrypted object is ready!!");
    tx.moveCall({
        target: `${constants_1.TESTNET_PACKAGES.SEAL_PACKAGE_ID}::bf_hmac_encryption::decrypt`,
        arguments: [encryptedObject, tx.pure.vector("id", [id0, id1]), tx.pure.vector("vector<u8>", Array.from(publicKeysList)), tx.pure.vector("vector<u8>", derivedKeysList)],
    });
    return tx;
}
//# sourceMappingURL=seal.js.map